import {
  Injectable,
  BadRequestException,
  NotFoundException,
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
    try {
      const response = await lastValueFrom(
        this.httpService.post(
          'https://api.paystack.co/transaction/initialize',
          { email: user.email, amount: amount.toString() },
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
          },
        ),
      );
      return response.data.data;
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
      if (Number(senderWallet.balance) <= amount)
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
      const email = event.data.customer.email;
      const amount = event.data.amount; // In Kobo
      const userWallet = await this.walletRepo.findOne({
        where: { user: { email } },
        relations: ['user'],
      });

      if (userWallet) {
        userWallet.balance = Number(userWallet.balance) + amount; // Store as Kobo or divide by 100
        await this.walletRepo.save(userWallet);
        const tx = this.transRepo.create({
          wallet: userWallet,
          amount,
          type: 'deposit',
          status: 'success',
          reference: event.data.reference,
        });
        await this.transRepo.save(tx);
      }
    }
  }
}
