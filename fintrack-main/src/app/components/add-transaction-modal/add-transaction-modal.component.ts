import { Component, computed, effect, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { Transaction, TransactionType } from '../../models/transaction.model';

@Component({
  selector: 'app-add-transaction-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-transaction-modal.component.html',
})
export class AddTransactionModalComponent {
  isOpen = input(false);
  editingTransaction = input<Transaction | null>(null);
  close = output<void>();
  finance = inject(FinanceService);

  name = '';
  amount: number | null = null;
  type: TransactionType = 'expense';
  category = 'Food';

  categories = ['Food', 'Rent', 'Transport', 'Entertainment', 'Subscription', 'Income', 'Other'];
  subscriptionNames = computed(() => this.finance.subscriptions().map(sub => sub.name));

  constructor() {
    effect(() => {
      const txn = this.editingTransaction();
      const open = this.isOpen();

      if (open && txn) {
        this.name = txn.name;
        this.amount = txn.amount;
        this.type = txn.type;
        this.category = txn.category;
      } else if (open && !txn) {
        this.reset();
      }
    });
  }

  get isEditMode(): boolean {
    return !!this.editingTransaction();
  }

  async submit() {
    if (!this.name.trim() || !this.amount) return;
    if (this.isEditMode) {
      await this.finance.updateTransaction(this.editingTransaction()!.id, this.name.trim(), this.amount, this.type, this.category);
    } else {
      await this.finance.addTransaction(this.name.trim(), this.amount, this.type, this.category);
    }
    this.reset();
    this.close.emit();
  }

  reset(): void {
    this.name = '';
    this.amount = null;
    this.type = 'expense';
    this.category = 'Food';
  }

  onTypeChange(value: TransactionType): void {
    this.type = value;
    if (value === 'subscription') {
      this.category = 'Subscription';
    } else if (value === 'income') {
      this.category = 'Income';
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }
}
