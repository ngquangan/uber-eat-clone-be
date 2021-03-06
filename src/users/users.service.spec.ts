import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { JwtService } from "src/jwt/jwt.service";
import { MailService } from "src/mail/mail.service";
import { User } from "./enities/user.entity";
import { Verification } from "./enities/verification.entity";
import { UserService } from "./users.service";

const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
}

const mockJWTService = {
    sign: jest.fn(),
    verify: jest.fn(),
}

const mockMailService = {
    sendVerificationEmail: jest.fn(),
}

describe("UserService", () => {
    let service: UserService;

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockRepository
                },
                {
                    provide: getRepositoryToken(Verification),
                    useValue: mockRepository
                },
                {
                    provide: JwtService,
                    useValue: mockJWTService
                },
                {
                    provide: MailService,
                    useValue: mockMailService
                },
            ]
        }).compile();

        service = module.get<UserService>(UserService);
    });

    it('shoud be defined', () => {
        expect(service).toBeDefined();
    });

    it.todo('createAccount');
    it.todo('login');
    it.todo('findById');
    it.todo('editProfile');
    it.todo('verifyEmail');
});