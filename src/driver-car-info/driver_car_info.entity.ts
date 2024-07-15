import { DriverTripOffers } from '../driver-trip-offers/driver_trip_offers.entity';
import { User } from 'src/users/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity({ name: 'driver_car_info' })
export class DriverCarInfo {
  @PrimaryColumn()
  id_driver: number;

  @Column()
  brand: string;

  @Column()
  plate: string;

  @Column()
  color: string;

  @Column() // Añade esta línea
  clinica: string; // Añade esta línea

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'id_driver' })
  driver: User;
}
