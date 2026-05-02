import { AfterViewInit, Component, ElementRef, ViewChild, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../services/finance.service';

declare const Chart: any;

interface CategoryData { label: string; color: string; pct: number; amount: number; }

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './donut-chart.component.html',
})
export class DonutChartComponent implements AfterViewInit {
  finance = inject(FinanceService);
  @ViewChild('donutCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  chart: any;

  categoryData = computed<CategoryData[]>(() => {
    const totals = new Map<string, { amount: number; color: string }>();
    const transactions = this.finance.transactions().filter(t => t.type !== 'income');
    transactions.forEach(txn => {
      const label = txn.category || 'Other';
      const color = this.finance.catBg[label] || '#4af4a0';
      const current = totals.get(label) || { amount: 0, color };
      totals.set(label, { amount: current.amount + txn.amount, color });
    });

    const total = Array.from(totals.values()).reduce((sum, value) => sum + value.amount, 0);
    return Array.from(totals.entries()).map(([label, data]) => ({
      label,
      amount: data.amount,
      color: data.color,
      pct: total ? Math.round((data.amount / total) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);
  });

  totalSpent = computed(() => this.categoryData().reduce((sum, item) => sum + item.amount, 0));

  constructor() {
    // effect هنا في constructor يعمل بشكل صحيح
    effect(() => {
      // تأكد من وجود chart قبل التحديث
      if (this.chart) {
        const categories = this.categoryData();
        this.chart.data.labels = categories.map(c => c.label);
        this.chart.data.datasets[0].data = categories.map(c => c.amount);
        this.chart.data.datasets[0].backgroundColor = categories.map(c => c.color);
        this.chart.update();
      }
    });
  }

  ngAfterViewInit(): void {
    this.chart = new Chart(this.canvasRef.nativeElement.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: this.categoryData().map(c => c.label),
        datasets: [{
          data: this.categoryData().map(c => c.amount),
          backgroundColor: this.categoryData().map(c => c.color),
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.parsed} USD` } }
        },
        animation: { duration: 800 }
      }
    });

    this.chart.update();
  }
}
