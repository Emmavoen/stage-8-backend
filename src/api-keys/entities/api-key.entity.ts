import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column()
  name: string;

  @Column('simple-array')
  permissions: string[];

  @Column()
  expires_at: Date;

  @Column({ default: true })
  is_active: boolean;

  @ManyToOne(() => User, (user) => user.apiKeys)
  user: User;
}
