import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:4000';

  private userSubject = new BehaviorSubject<User>({
    id: 1,
    name: '',
    email: '',
    phone: ''
  });

  public currentUser$ = this.userSubject.asObservable();

  constructor() {
    this.loadUser();
  }

  private async loadUser() {
    try {
      const users = await firstValueFrom(this.http.get<User[]>(`${this.apiUrl}/users`));
      if (users && users.length) {
        this.userSubject.next(users[0]);
      } else {
        console.warn('No users found in db.json');
      }
    } catch (error) {
      console.error(error);
    }
  }

  async updateUser(updatedUser: User): Promise<boolean> {
    try {
      await firstValueFrom(this.http.put(`${this.apiUrl}/users/${updatedUser.id}`, updatedUser));
      this.userSubject.next(updatedUser);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  getCurrentUser(): User {
    return this.userSubject.getValue();
  }
}