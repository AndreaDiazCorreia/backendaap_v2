import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { SocketModule } from './socket/socket.module';
import { DriversPositionModule } from './driver-position/drivers_position.module';
import { ClientRequestsModule } from './client-requests/client_requests.module';
import { TimeAndDistanceValuesModule } from './time-and-distance-value/time_and_distance_values.module';
import { DriverTripOffersModule } from './driver-trip-offers/driver_trip_offers.module';
import { DriverCarInfoModule } from './driver-car-info/driver_car_info.module';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './firebase/firebase.module';
import { MailerModule } from '@nestjs-modules/mailer';
import * as nodemailer from 'nodemailer';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'aap',
      password: 'aaptestmvp',
      database: 'aap',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    ConfigModule.forRoot({ cache: true }),
    MailerModule.forRootAsync({
      useFactory: async () => {
        const testAccount = await nodemailer.createTestAccount();

        return {
          transport: {
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          },
          defaults: {
            from: '"No Reply" <noreply@example.com>',
          },
        };
      },
    }),
    UsersModule,
    AuthModule,
    RolesModule,
    SocketModule,
    DriversPositionModule,
    ClientRequestsModule,
    TimeAndDistanceValuesModule,
    DriverTripOffersModule,
    DriverCarInfoModule,
    FirebaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
