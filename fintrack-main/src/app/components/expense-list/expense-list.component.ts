import { Component, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { Transaction, TransactionType } from '../../models/transaction.model';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expense-list.component.html',
})
export class ExpenseListComponent {
  finance = inject(FinanceService);
  editTransaction = output<Transaction>();
  activeFilter = signal<string>('all');
  searchQuery = signal('');

  filteredTransactions = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const f = this.activeFilter();
    return this.finance.transactions().filter(t => {
      const matchesFilter = f === 'all' || t.type === f;
      const matchesSearch = t.name.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  });

  filters = [
    { label: 'All', value: 'all' },
    { label: 'Income', value: 'income' },
    { label: 'Expenses', value: 'expense' },
    { label: 'Subscriptions', value: 'subscription' },
  ];

  pendingDeleteId = signal<number | null>(null);

  setFilter(value: string): void {
    this.activeFilter.set(value);
  }

  delete(id: number): void {
    this.pendingDeleteId.set(id);
  }

  async confirmDelete() {
    const id = this.pendingDeleteId();
    if (id !== null) {
      await this.finance.deleteTransaction(id);
      this.pendingDeleteId.set(null);
    }
  }

  cancelDelete(): void {
    this.pendingDeleteId.set(null);
  }

  edit(txn: Transaction): void {
    this.editTransaction.emit(txn);
  }
}