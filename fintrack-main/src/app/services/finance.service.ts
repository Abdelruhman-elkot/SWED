import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { Transaction, Subscription } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:4000';

  transactions = signal<Transaction[]>([]);
  subscriptions = signal<Subscription[]>([]);
  balance = signal<number>(0);
  income = signal<number>(0);
  budget = signal<number>(4200);

  totalSpent = computed(() =>
    this.transactions().filter(t => t.type !== 'income').reduce((s, t) => s + t.amount, 0)
  );
  totalIncome = computed(() =>
    this.transactions().filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  );
  totalSubscriptions = computed(() =>
    this.subscriptions().reduce((sum, sub) => sum + sub.price, 0)
  );
  budgetRemaining = computed(() => this.budget() - this.totalSpent());
  activeSubscriptionsCount = computed(() => this.subscriptions().length);
  recentTransactions = computed(() => [...this.transactions()].slice(0, 5));

  readonly catIcons: Record<string, string> = {
    Food: '🛒', Rent: '🏠', Transport: '🚗',
    Entertainment: '🎬', Subscription: '🎵', Income: '💰', Other: '📦'
  };
  readonly catBg: Record<string, string> = {
    Food: '#1a2e1a', Rent: '#1a1f2e', Transport: '#2e1a1a',
    Entertainment: '#1a1a2e', Subscription: '#2e1e0d', Income: '#0d2318', Other: '#1a1a1a'
  };

  constructor() {
    this.loadAllData();
  }

  private async loadAllData() {
    try {
      const [txns, subs, fin] = await Promise.all([
        firstValueFrom(this.http.get<Transaction[]>(`${this.apiUrl}/transactions`)),
        firstValueFrom(this.http.get<Subscription[]>(`${this.apiUrl}/subscriptions`)),
        firstValueFrom(this.http.get<any>(`${this.apiUrl}/finance`))
      ]);
      this.transactions.set(txns);
      this.subscriptions.set(subs);
      this.balance.set(fin.balance);
      this.income.set(fin.income);
      this.budget.set(fin.budget);
    } catch (error) {
      console.error(error);
    }
  }

  private async saveFinance() {
    await firstValueFrom(this.http.patch(`${this.apiUrl}/finance`, {
      balance: this.balance(),
      income: this.income(),
      budget: this.budget()
    }));
  }

  async addTransaction(name: string, amount: number, type: any, category: string) {
    const icon = this.catIcons[category] || '📦';
    const iconBg = this.catBg[category] || '#1a1a1a';
    const newTxn = { name, amount, type, category, icon, iconBg, date: 'Today' };
    try {
      const added = await firstValueFrom(this.http.post<Transaction>(`${this.apiUrl}/transactions`, newTxn));
      this.transactions.set([added, ...this.transactions()]);
      if (type === 'subscription') {
        await this.addOrUpdateSubscription(name, amount, icon, iconBg);
      }
    } catch (error) {
      console.error('Failed to add transaction', error);
    }
  }

  async updateTransaction(id: number, name: string, amount: number, type: any, category: string) {
    const updatedFields = { name, amount, type, category, icon: this.catIcons[category], iconBg: this.catBg[category] };
    try {
      await firstValueFrom(this.http.patch(`${this.apiUrl}/transactions/${id}`, updatedFields));
      const updatedTxns = this.transactions().map(t => t.id === id ? { ...t, ...updatedFields } : t);
      this.transactions.set(updatedTxns);
      const oldTxn = this.transactions().find(t => t.id === id);
      if (oldTxn?.type === 'subscription') await this.removeSubscriptionIfUnused(oldTxn.name);
      if (type === 'subscription') await this.addOrUpdateSubscription(name, amount, this.catIcons[category], this.catBg[category]);
    } catch (error) {
      console.error('Failed to update transaction', error);
    }
  }

  async deleteTransaction(id: number) {
    const toDelete = this.transactions().find(t => t.id === id);
    if (!toDelete) return;
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/transactions/${id}`));
      this.transactions.set(this.transactions().filter(t => t.id !== id));
      if (toDelete.type === 'subscription') {
        await this.removeSubscriptionIfUnused(toDelete.name);
      }
    } catch (error) {
      console.error('Failed to delete transaction', error);
    }
  }

  private async addOrUpdateSubscription(name: string, price: number, icon: string, iconBg: string) {
    const existing = this.subscriptions().find(s => s.name === name);
    if (existing && existing.id) {
      const updated = { ...existing, price, icon, iconBg, renewDate: this.buildRenewDate() };
      await firstValueFrom(this.http.put(`${this.apiUrl}/subscriptions/${existing.id}`, updated));
      this.subscriptions.set(this.subscriptions().map(s => s.id === existing.id ? updated : s));
    } else {
      const newSub: Omit<Subscription, 'id'> = { name, price, icon, iconBg, renewDate: this.buildRenewDate(), frequency: 'monthly' };
      const added = await firstValueFrom(this.http.post<Subscription>(`${this.apiUrl}/subscriptions`, newSub));
      this.subscriptions.set([added, ...this.subscriptions()]);
    }
  }

  private async removeSubscriptionIfUnused(name: string) {
    const stillUsed = this.transactions().some(t => t.type === 'subscription' && t.name === name);
    if (!stillUsed) {
      const toDelete = this.subscriptions().find(s => s.name === name);
      if (toDelete && toDelete.id) {
        await firstValueFrom(this.http.delete(`${this.apiUrl}/subscriptions/${toDelete.id}`));
        this.subscriptions.set(this.subscriptions().filter(s => s.name !== name));
      }
    }
  }

  async addSubscriptionPlan(name: string, price: number) {
    await this.addOrUpdateSubscription(name, price, this.catIcons['Subscription'], this.catBg['Subscription']);

    const icon = this.catIcons['Subscription'];
    const iconBg = this.catBg['Subscription'];
    const newTxn = {
      name: name,
      amount: price,
      type: 'subscription',
      category: 'Subscription',
      icon: icon,
      iconBg: iconBg,
      date: 'Today'
    };
    try {
      const addedTxn = await firstValueFrom(this.http.post<Transaction>(`${this.apiUrl}/transactions`, newTxn));
      this.transactions.set([addedTxn, ...this.transactions()]);
      console.log(`Transaction added for subscription: ${name}`);
    } catch (error) {
      console.error('Failed to add transaction for new subscription', error);
    }
  }

  async deleteSubscriptionPlan(name: string) {
    const toDelete = this.subscriptions().find(s => s.name === name);
    if (toDelete && toDelete.id) {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/subscriptions/${toDelete.id}`));
      this.subscriptions.set(this.subscriptions().filter(s => s.name !== name));
    }
  }

  async updateBalance(newBalance: number) {
    this.balance.set(newBalance);
    await this.saveFinance();
  }
  async updateIncome(newIncome: number) {
    this.income.set(newIncome);
    await this.saveFinance();
  }

  private buildRenewDate(): string {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}