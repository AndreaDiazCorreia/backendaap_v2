import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../users/user.entity';
import { Repository, In } from 'typeorm';
import { RegisterAuthDto } from './register-auth.dto';
import { LoginAuthDto } from './login-auth.dto';
import { compare, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Rol } from '../../roles/rol.entity';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
  private resetCodes: Map<string, { code: string; expiry: Date }> = new Map();

  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(Rol) private rolesRepository: Repository<Rol>,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  async register(user: RegisterAuthDto) {
    const { email, phone } = user;
    const emailExist = await this.usersRepository.findOneBy({ email: email });

    if (emailExist) {
      throw new HttpException(
        'El email ya está registrado',
        HttpStatus.CONFLICT,
      );
    }

    const phoneExist = await this.usersRepository.findOneBy({ phone: phone });

    if (phoneExist) {
      throw new HttpException(
        'El teléfono ya está registrado',
        HttpStatus.CONFLICT,
      );
    }

    const newUser = this.usersRepository.create(user);
    let rolesIds = [];

    if (user.rolesIds !== undefined && user.rolesIds !== null) {
      rolesIds = user.rolesIds;
    } else {
      rolesIds.push('CLIENT');
    }

    const roles = await this.rolesRepository.findBy({ id: In(rolesIds) });
    newUser.roles = roles;

    const userSaved = await this.usersRepository.save(newUser);

    const rolesString = userSaved.roles.map((rol) => rol.id);
    const payload = {
      id: userSaved.id,
      name: userSaved.name,
      roles: rolesString,
    };
    const token = this.jwtService.sign(payload);
    const data = {
      user: userSaved,
      token: 'Bearer ' + token,
    };
    delete data.user.password;
    return data;
  }

  async login(loginData: LoginAuthDto) {
    const { email, password } = loginData;
    const userFound = await this.usersRepository.findOne({
      where: { email: email },
      relations: ['roles'],
    });

    if (!userFound) {
      throw new HttpException('El email no existe', HttpStatus.NOT_FOUND);
    }

    const isPasswordValid = await compare(password, userFound.password);
    if (!isPasswordValid) {
      throw new HttpException(
        'La contraseña es incorrecta',
        HttpStatus.FORBIDDEN,
      );
    }

    const rolesIds = userFound.roles.map((rol) => rol.id);

    const payload = {
      id: userFound.id,
      name: userFound.name,
      roles: rolesIds,
    };
    const token = this.jwtService.sign(payload);
    const data = {
      user: userFound,
      token: 'Bearer ' + token,
    };

    delete data.user.password;

    return data;
  }

  async forgotPassword(email: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new HttpException('El email no existe', HttpStatus.NOT_FOUND);
    }

    const code = this.generateResetCode();
    const expiry = new Date(Date.now() + 3600000); // 1 hora de validez
    this.resetCodes.set(email, { code, expiry });

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Código de recuperación de contraseña',
      html: `
    <p>Hola ${user.name},</p>
    <p>Tu código de recuperación de contraseña es: <strong>${code}</strong></p>
    <p>Este código expirará en 1 hora.</p>
    <p>Si no solicitaste restablecer tu contraseña, ignora este correo.</p>
  `, // Update the template path here
    });

    return {
      message:
        'Se ha enviado un código de recuperación a su correo electrónico',
    };
  }

  async verifyCode(email: string, code: string) {
    const resetData = this.resetCodes.get(email);
    if (
      !resetData ||
      resetData.code !== code ||
      new Date() > resetData.expiry
    ) {
      throw new HttpException(
        'Código inválido o expirado',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return { message: 'Código verificado correctamente' };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const resetData = this.resetCodes.get(email);
    if (
      !resetData ||
      resetData.code !== code ||
      new Date() > resetData.expiry
    ) {
      throw new HttpException(
        'Código inválido o expirado',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new HttpException('El email no existe', HttpStatus.NOT_FOUND);
    }

    const hashedPassword = await hash(newPassword, 10);
    user.password = hashedPassword;
    await this.usersRepository.save(user);

    this.resetCodes.delete(email); // Eliminar el código usado

    return { message: 'Contraseña actualizada con éxito' };
  }

  private generateResetCode(): string {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }
}
