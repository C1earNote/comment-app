import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @ManyToOne(() => User, user => user.comments)
  user: User;

  @ManyToOne(() => Comment, comment => comment.children, { nullable: true, onDelete: 'CASCADE' })
  parent: Comment;

  @OneToMany(() => Comment, comment => comment.parent)
  children: Comment[];

  @Column({ default: false })
  deleted: boolean;

  @Column({ type: 'timestamp', nullable: true, default: null })
  deletedAt: Date | null; // ✅ FIXED TYPE

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}