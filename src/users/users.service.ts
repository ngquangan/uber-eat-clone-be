import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from "@nestjs/common";
import { Repository } from 'typeorm';


import { User } from './enities/user.entity';
import { CreateAccountInput, CreateAccountOutput } from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Verification } from './enities/verification.entity';
import { MailService } from 'src/mail/mail.service';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailOutput } from './dtos/verify-email.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private readonly users: Repository<User>,
        @InjectRepository(Verification) private readonly verifications: Repository<Verification>,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService
    ) { }

    async createAccount({ email, password, role }: CreateAccountInput): Promise<CreateAccountOutput> {
        try {
            const exists = await this.users.findOne({ email });
            if (exists) {
                return {
                    ok: false,
                    error: "There is a user with the email already"
                }
            }

            const user = await this.users.save(this.users.create({
                email,
                password,
                role
            }));

            const verification = await this.verifications.save(this.verifications.create({
                user
            }));

            this.mailService.sendVerificationEmail(user.email, verification.code);
            return { ok: true };
        } catch (e) {
            return {
                ok: false,
                error: "Couldn't create account"
            };
        }
    }

    async login({ email, password }: LoginInput): Promise<LoginOutput> {
        try {
            const user = await this.users.findOne({ email }, { select: ['id', 'password'] });
            if (!user) {
                throw new Error('User not found!');
            }

            const passwordCorrect = await user.checkPassword(password);
            if (!passwordCorrect) {
                throw new Error('Wrong password!');
            }

            const token = this.jwtService.sign(user.id);
            return {
                ok: true,
                error: null,
                token
            }

        } catch (e) {
            return {
                ok: false,
                error: e,
            }
        }
    }

    async findById(id: number): Promise<UserProfileOutput> {
        try {
            const user = await this.users.findOne({ id });
            if (!user) {
                throw new Error('User not found!');
            }

            return {
                ok: true,
                user
            }
        } catch (error) {
            return {
                ok: false,
                error
            }
        }
    }

    async editProfile(userId: number, { email, password }: EditProfileInput): Promise<EditProfileOutput> {
        try {
            const user = await this.users.findOne({ id: userId });

            if (!user) {
                throw new Error('User not found!');
            }

            if (email) {
                user.email = email;
                user.verified = false;
                await this.verifications.save(this.verifications.create({
                    user
                }));
            }
            if (password) {
                user.password = password;
            }

            await this.users.save(user);

            return {
                ok: true
            }
        } catch (error) {
            return {
                ok: false,
                error
            }
        }
    }

    async verifyEmail(code: string): Promise<VerifyEmailOutput> {
        try {
            const verification = await this.verifications.findOne({ code }, { relations: ['user'] });

            if (!verification) {
                throw new Error('Can not verify email');
            }

            verification.user.verified = true;
            await this.users.save(verification.user);
            await this.verifications.delete(verification.id);

            return {
                ok: true,
            };
        } catch (error) {
            return {
                ok: false,
                error,
            }
        }
    }
}