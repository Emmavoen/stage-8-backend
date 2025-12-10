import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);
  constructor(
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    @InjectRepository(Transaction) private transRepo: Repository<Transaction>,
    private dataSource: DataSource,
    private httpService: HttpService,
  ) {}

  async createWallet(user: User) {
    const wallet = this.walletRepo.create({
      user,
      wallet_number:
        Date.now().toString().slice(-10) + Math.floor(Math.random() * 100),
    });
    return await this.walletRepo.save(wallet);
  }

  async initiateDeposit(user: User, amount: number) {
    const amountKobo = Math.ceil(amount * 100);
    try {
      const response = await lastValueFrom(
        this.httpService.post(
          'https://api.paystack.co/transaction/initialize',
          {
            email: user.email,
            amount: amountKobo.toString(),
            metadata: { userId: user.id },
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
          },
        ),
      );
      const data = response.data.data;

      // 3. Ensure Wallet Exists
      let wallet = await this.walletRepo.findOne({
        where: { user: { id: user.id } },
      });
      if (!wallet) wallet = await this.createWallet(user);

      // 4. CREATE PENDING TRANSACTION (The Fix)
      // We save the amount in NAIRA as requested
      const transaction = this.transRepo.create({
        wallet: wallet,
        amount: amount, // Saving Naira
        reference: data.reference,
        status: 'pending',
        type: 'deposit',
      });
      await this.transRepo.save(transaction);

      return data;
    } catch (e) {
      throw new BadRequestException('Paystack Error');
    }
  }

  async transfer(senderUser: User, recipientWalletNum: string, amount: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const senderWallet = await queryRunner.manager.findOne(Wallet, {
        where: { user: { id: senderUser.id } },
        lock: { mode: 'pessimistic_write' },
      });
      if (!senderWallet) throw new NotFoundException('Sender wallet not found');
      if (Number(senderWallet.balance) < amount)
        throw new BadRequestException('Insufficient funds');

      const recipientWallet = await queryRunner.manager.findOne(Wallet, {
        where: { wallet_number: recipientWalletNum },
      });
      if (!recipientWallet) throw new NotFoundException('Recipient not found');

      senderWallet.balance = Number(senderWallet.balance) - amount;
      recipientWallet.balance = Number(recipientWallet.balance) + amount;

      await queryRunner.manager.save([senderWallet, recipientWallet]);

      const debit = this.transRepo.create({
        wallet: senderWallet,
        amount,
        type: 'transfer_debit',
        status: 'success',
        counterparty_wallet_number: recipientWallet.wallet_number,
      });
      const credit = this.transRepo.create({
        wallet: recipientWallet,
        amount,
        type: 'transfer_credit',
        status: 'success',
        counterparty_wallet_number: senderWallet.wallet_number,
      });

      await queryRunner.manager.save([debit, credit]);
      await queryRunner.commitTransaction();
      return { status: 'success', message: 'Transfer completed' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getBalance(user: User) {
    return this.walletRepo.findOne({ where: { user: { id: user.id } } });
  }

  async getHistory(user: User) {
    return this.transRepo.find({
      where: { wallet: { user: { id: user.id } } },
      order: { createdAt: 'DESC' },
    });
  }

  async processWebhook(signature: string, event: any) {
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(JSON.stringify(event))
      .digest('hex');
    if (hash !== signature) throw new BadRequestException('Invalid Signature');

    if (event.event === 'charge.success') {
      const reference = event.data.reference;

      // 2. IDEMPOTENCY CHECK: Find the transaction first
      const transaction = await this.transRepo.findOne({
        where: { reference },
        relations: ['wallet'],
      });

      if (!transaction) {
        // This is weird. We initiated it but didn't save it?
        // Or it's a manual transfer not initiated via our API.
        this.logger.warn(
          `Webhook received for unknown reference: ${reference}`,
        );
        return;
      }

      // 3. STOP if already successful (Double Credit Prevention)
      if (transaction.status === 'success') {
        this.logger.log(
          `Transaction ${reference} already processed. Skipping.`,
        );
        return;
      }

      // 4. Update Balance & Status Atomically
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Lock the wallet for update
        const wallet = await queryRunner.manager.findOne(Wallet, {
          where: { id: transaction.wallet.id },
          lock: { mode: 'pessimistic_write' },
        });

        if (wallet) {
          // Update Wallet Balance (Amount is already in Naira in the Transaction table)
          wallet.balance = Number(wallet.balance) + Number(transaction.amount);
        }
        // Update Transaction Status
        transaction.status = 'success';
        // Optional: Update paidAt if you have that column
        // transaction.paidAt = new Date();

        await queryRunner.manager.save(wallet);
        await queryRunner.manager.save(transaction); // Save the updated status

        await queryRunner.commitTransaction();
        this.logger.log(`Deposit successful: ${reference}`);
      } catch (err) {
        await queryRunner.rollbackTransaction();
        this.logger.error(`Failed to credit wallet: ${err.message}`);
      } finally {
        await queryRunner.release();
      }
    }
  }
}
