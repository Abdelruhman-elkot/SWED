import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FinanceService } from '../services/finance.service';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css'],
  standalone: true,                       
  imports: [CommonModule, FormsModule, RouterModule]    
})
export class UserComponent implements OnInit, OnDestroy {
  user: User = { id: 1, name: '', email: '', phone: '' };
  private subscription: any;
  finance = inject(FinanceService);
  isEditing = false;
  editData: User = { id: 1, name: '', email: '', phone: '' };

  tempBalance = 0;
  tempIncome = 0;
  newSubName = '';
  newSubCost = 0;
  pendingDeleteSubscription: string | null = null;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.subscription = this.userService.currentUser$.subscribe(user => {
      this.user = user;
      this.editData = { ...user };
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  get initials(): string {
    return this.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  startEdit() {
    this.editData = { ...this.user };
    this.isEditing = true;
  }

  async saveEdit() {
    const success = await this.userService.updateUser(this.editData);
    if (success) {
      this.isEditing = false;
    }
  }

  cancelEdit() { this.isEditing = false; }

  async saveFinancials() {
    if (this.tempBalance) await this.finance.updateBalance(this.tempBalance);
    if (this.tempIncome) await this.finance.updateIncome(this.tempIncome);
    this.tempBalance = this.tempIncome = 0;
  }

  async addSubscriptionPlan() {
    if (!this.newSubName.trim() || this.newSubCost <= 0) return;
    await this.finance.addSubscriptionPlan(this.newSubName.trim(), this.newSubCost);
    this.newSubName = '';
    this.newSubCost = 0;
  }

  requestDeleteSubscription(name: string): void {
    this.pendingDeleteSubscription = name;
  }

  cancelDeleteSubscription(): void {
    this.pendingDeleteSubscription = null;
  }

  async confirmDeleteSubscription() {
    if (!this.pendingDeleteSubscription) return;
    await this.finance.deleteSubscriptionPlan(this.pendingDeleteSubscription);
    this.pendingDeleteSubscription = null;
  }
}
