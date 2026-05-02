import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { SummaryCardsComponent } from '../summary-cards/summary-cards.component';
import { DonutChartComponent } from '../donut-chart/donut-chart.component';
import { ExpenseListComponent } from '../expense-list/expense-list.component';
import { RightPanelComponent } from '../right-panel/right-panel.component';
import { AddTransactionModalComponent } from '../add-transaction-modal/add-transaction-modal.component';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    SummaryCardsComponent,
    DonutChartComponent,
    ExpenseListComponent,
    RightPanelComponent,
    AddTransactionModalComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  modalOpen = signal(false);
  editingTransaction = signal<Transaction | null>(null);

  openModal(): void {
    this.modalOpen.set(true);
  }

  onEditTransaction(txn: Transaction): void {
    this.editingTransaction.set(txn);
    this.modalOpen.set(true);
  }

  onCloseModal(): void {
    this.modalOpen.set(false);
    this.editingTransaction.set(null);
  }
}