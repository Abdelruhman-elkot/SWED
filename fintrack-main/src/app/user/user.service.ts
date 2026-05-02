import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:4000';

  async getUser(): Promise<User> {
    const users = await firstValueFrom(this.http.get<User[]>(`${this.apiUrl}/users`));
    return users?.[0] || { id: 1, name: '', email: '', phone: '' };
  }
  
  async updateUser(user: User): Promise<void> {
    await firstValueFrom(this.http.put(`${this.apiUrl}/users/${user.id}`, user));
  }
}