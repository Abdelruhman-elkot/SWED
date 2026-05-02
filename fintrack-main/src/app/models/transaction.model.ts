export type TransactionType = 'expense' | 'income' | 'subscription';

export interface Transaction {
  id: number;
  name: string;
  category: string;
  type: TransactionType;
  amount: number;
  date: string;
  icon: string;
  iconBg: string;
}

export interface Subscription {
  id?: string | number;
  name: string;
  icon: string;
  iconBg: string;
  price: number;
  renewDate: string;
  frequency: 'monthly';
}
