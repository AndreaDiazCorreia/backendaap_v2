import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { hash } from 'bcrypt';
import { Rol } from 'src/roles/rol.entity';
import { DriversPosition } from '../driver-position/drivers_position.entity';
import { ClientRequests } from '../client-requests/client_requests.entity';
import { DriverTripOffers } from '../driver-trip-offers/driver_trip_offers.entity';
import { DriverCarInfo } from '../driver-car-info/driver_car_info.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  lastname: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  image: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  notification_token: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @JoinTable({
    name: 'user_has_roles',
    joinColumn: {
      name: 'id_user',
    },
    inverseJoinColumn: {
      name: 'id_rol',
    },
  })
  @ManyToMany(() => Rol, (rol) => rol.users)
  roles: Rol[];

  @OneToMany(
    () => DriversPosition,
    (driversPosition) => driversPosition.id_driver,
  )
  driversPosition: DriversPosition;

  @OneToMany(() => ClientRequests, (clientRequests) => clientRequests.id_client)
  clientRequests: ClientRequests;

  @OneToMany(
    () => ClientRequests,
    (clientRequests) => clientRequests.id_driver_assigned,
  )
  clientRequestsDriverAssigned: ClientRequests;

  @OneToMany(
    () => DriverTripOffers,
    (driverTripOffers) => driverTripOffers.id_driver,
  )
  driverTripOffers: DriverTripOffers;

  @OneToMany(() => DriverCarInfo, (driverCarInfo) => driverCarInfo.id_driver)
  driverCarInfo: DriverCarInfo;

  @BeforeInsert()
  async hashPassword() {
    this.password = await hash(this.password, Number(process.env.HASH_SALT));
  }
}
