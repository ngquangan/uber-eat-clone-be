import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { string as JoiString, object as JoiObject } from 'joi';

import { UserModule } from './users/users.module';
import { User } from './users/enities/user.entity';
import { JwtModule } from './jwt/jwt.module';
import { JwtMiddleware } from './jwt/jwt.middleware';
import { MailModule } from './mail/mail.module';
import { Verification } from './users/enities/verification.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
      ignoreEnvFile: process.env.NODE_ENV === 'prod',
      validationSchema: JoiObject({
        NODE_ENV: JoiString().valid('dev', 'prod'),
        DB_HOST: JoiString().required(),
        DB_PORT: JoiString().required(),
        DB_USERNAME: JoiString().required(),
        DB_PASSWORD: JoiString().required(),
        DB_NAME: JoiString().required(),
        PRIVATE_KEY: JoiString().required(),
        MAILGUN_API_KEY: JoiString().required(),
        MAILGUN_DOMAIN_NAME: JoiString().required(),
        MAILGUN_FROM_EMAIL: JoiString().required()
      })
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: process.env.NODE_ENV !== 'prod',
      logging: true,
      entities: [User, Verification],
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: true,
      context: ({ req }) => {
        return {
          user: req['user']
        }
      }
    }),
    JwtModule.forRoot({
      privateKey: process.env.PRIVATE_KEY
    }),
    MailModule.forRoot({
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN_NAME,
      fromEmail: process.env.MAILGUN_FROM_EMAIL,
    }),
    UserModule,
  ],
  controllers: [],
  providers: [],
})

export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer): void {
    // Can define funtion middleware
    consumer.apply(JwtMiddleware).forRoutes({
      path: '/graphql',
      method: RequestMethod.POST
    });
  }
}
