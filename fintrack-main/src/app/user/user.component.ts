import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FinanceService } from '../services/finance.service';
import { UserService } from './user.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css'],
  standalone: true,                       
  imports: [CommonModule, FormsModule, RouterModule]    
})
export class UserComponent implements OnInit {
  user: User = { id: 1, name: '', email: '', phone: '' };
  finance = inject(FinanceService);
  isEditing = false;
  editData: User = { id: 1, name: '', email: '', phone: '' };

  tempBalance = 0;
  tempIncome = 0;
  newSubName = '';
  newSubCost = 0;
  pendingDeleteSubscription: string | null = null;

  constructor(private userService: UserService) {}

  async ngOnInit() {
    this.user = await this.userService.getUser();
    this.tempBalance = this.finance.balance();
    this.tempIncome = this.finance.income();
  }

  get initials(): string {
    return this.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  startEdit() {
    this.editData = { ...this.user };
    this.isEditing = true;
  }

  async saveEdit() {
    await this.userService.updateUser(this.editData);
    this.user = { ...this.editData };
    this.isEditing = false;
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
