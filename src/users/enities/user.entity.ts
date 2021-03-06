import { BeforeInsert, BeforeUpdate, Column, Entity } from "typeorm";
import { InternalServerErrorException } from "@nestjs/common";
import { hash, compare, } from 'bcrypt';
import { Field, InputType, ObjectType, registerEnumType } from "@nestjs/graphql";

import { CoreEntity } from "src/common/entities/core.entity";
import { IsEmail, IsEnum, IsString, Length } from "class-validator";
enum UserRole {
    Client,
    Owner,
    Delivery
};
registerEnumType(UserRole, { name: 'UserRole' })

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity{

    @Field(type => String)
    @Column()
    @IsEmail()
    email: string;

    @Field(type => String, { nullable: true })
    @Column({ select: false })
    @IsString()
    @Length(6)
    password: string;

    @Field(type => UserRole)
    @Column({type: 'enum', enum: UserRole})
    @IsEnum(UserRole)
    role: UserRole;

    @Column({ default: false })
    @Field(type => Boolean)
    verified: boolean;

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword(): Promise<void> {
        if (!this.password) return;

        try {
            this.password = await hash(this.password, 10);
        } catch (e) {
            console.log(e);
            throw new InternalServerErrorException();
        }
    }

    async checkPassword(aPassword: string): Promise<boolean> {
        try {
            return await compare(aPassword, this.password);
        } catch (e) {
            console.log(e);
            throw new InternalServerErrorException();
        }
    }
}