import { BankTransaction, ReconciliationMatch, PaymentBreakdown } from './types';

export interface MatchCandidate {
  bankTransaction: BankTransaction;
  saleId: string;
  saleTotal: number;
  saleDate: Date;
  confidence: number;
  reasons: string[];
}

export class ReconciliationEngine {
  /**
   * Calculate confidence score for matching a bank transaction to a sale
   */
  static calculateMatchConfidence(
    bankTransaction: BankTransaction,
    saleTotal: number,
    saleDate: Date,
    paymentBreakdown: PaymentBreakdown[]
  ): { confidence: number; reasons: string[] } {
    let confidence = 0;
    const reasons: string[] = [];

    // Amount match (highest weight)
    const amountDiff = Math.abs(bankTransaction.amount - saleTotal);
    if (amountDiff === 0) {
      confidence += 50;
      reasons.push('Exact amount match');
    } else if (amountDiff < 1) {
      confidence += 40;
      reasons.push('Amount within 1 unit');
    } else if (amountDiff < 10) {
      confidence += 25;
      reasons.push('Amount within 10 units');
    } else if (amountDiff < 100) {
      confidence += 10;
      reasons.push('Amount within 100 units');
    }

    // Date proximity
    const dateDiffDays = Math.abs(
      (bankTransaction.date.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (dateDiffDays === 0) {
      confidence += 25;
      reasons.push('Same day');
    } else if (dateDiffDays <= 1) {
      confidence += 20;
      reasons.push('Within 1 day');
    } else if (dateDiffDays <= 3) {
      confidence += 15;
      reasons.push('Within 3 days');
    } else if (dateDiffDays <= 7) {
      confidence += 10;
      reasons.push('Within 7 days');
    } else if (dateDiffDays <= 30) {
      confidence += 5;
      reasons.push('Within 30 days');
    }

    // Reference match
    if (bankTransaction.reference) {
      const hasTransferPayment = paymentBreakdown.some(pb => pb.method === 'transfer');
      if (hasTransferPayment) {
        confidence += 15;
        reasons.push('Transfer payment with reference');
      }
    }

    // Narration match (customer name, invoice number, etc.)
    if (bankTransaction.narration) {
      confidence += 10;
      reasons.push('Narration available');
    }

    return { confidence, reasons };
  }

  /**
   * Find potential matches for a bank transaction
   */
  static findMatches(
    bankTransaction: BankTransaction,
    sales: Array<{ id: string; totalRevenue: number; createdAt: Date; paymentBreakdown: PaymentBreakdown[] }>,
    minConfidence: number = 50
  ): MatchCandidate[] {
    const candidates: MatchCandidate[] = [];

    for (const sale of sales) {
      const { confidence, reasons } = this.calculateMatchConfidence(
        bankTransaction,
        sale.totalRevenue,
        sale.createdAt,
        sale.paymentBreakdown || []
      );

      if (confidence >= minConfidence) {
        candidates.push({
          bankTransaction,
          saleId: sale.id,
          saleTotal: sale.totalRevenue,
          saleDate: sale.createdAt,
          confidence,
          reasons,
        });
      }
    }

    // Sort by confidence descending
    return candidates.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Auto-match bank transactions to sales
   */
  static autoReconcile(
    bankTransactions: BankTransaction[],
    sales: Array<{ id: string; totalRevenue: number; createdAt: Date; paymentBreakdown: PaymentBreakdown[] }>,
    autoConfirmThreshold: number = 80
  ): ReconciliationMatch[] {
    const matches: ReconciliationMatch[] = [];
    const matchedSaleIds = new Set<string>();
    const matchedBankTxIds = new Set<string>();

    for (const bankTx of bankTransactions) {
      if (matchedBankTxIds.has(bankTx.id)) continue;

      const candidates = this.findMatches(bankTx, sales, 50);

      for (const candidate of candidates) {
        if (matchedSaleIds.has(candidate.saleId)) continue;

        const status = candidate.confidence >= autoConfirmThreshold ? 'confirmed' : 'pending';
        
        matches.push({
          id: `match_${Date.now()}_${bankTx.id.substring(0, 8)}_${candidate.saleId.substring(0, 8)}`,
          bankTransactionId: bankTx.id,
          saleId: candidate.saleId,
          confidence: candidate.confidence,
          status,
          matchedBy: 'system',
          matchedAt: new Date(),
          matchReasons: candidate.reasons,
        });

        matchedSaleIds.add(candidate.saleId);
        matchedBankTxIds.add(bankTx.id);
        break; // Only match one sale per bank transaction
      }
    }

    return matches;
  }

  /**
   * Get unmatched sales
   */
  static getUnmatchedSales(
    sales: Array<{ id: string }>,
    matches: ReconciliationMatch[]
  ): string[] {
    const matchedSaleIds = new Set(matches.map(m => m.saleId));
    return sales.filter(s => !matchedSaleIds.has(s.id)).map(s => s.id);
  }

  /**
   * Get unmatched bank transactions
   */
  static getUnmatchedBankTransactions(
    bankTransactions: Array<{ id: string }>,
    matches: ReconciliationMatch[]
  ): string[] {
    const matchedBankTxIds = new Set(matches.map(m => m.bankTransactionId));
    return bankTransactions.filter(bt => !matchedBankTxIds.has(bt.id)).map(bt => bt.id);
  }

  /**
   * Calculate reconciliation statistics
   */
  static calculateReconciliationStats(
    totalSales: number,
    totalBankTransactions: number,
    matches: ReconciliationMatch[]
  ) {
    const confirmedMatches = matches.filter(m => m.status === 'confirmed').length;
    const pendingMatches = matches.filter(m => m.status === 'pending').length;
    const rejectedMatches = matches.filter(m => m.status === 'rejected').length;

    const averageConfidence = matches.length > 0
      ? matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length
      : 0;

    return {
      totalMatches: matches.length,
      confirmedMatches,
      pendingMatches,
      rejectedMatches,
      unmatchedSales: totalSales - confirmedMatches,
      unmatchedBankTransactions: totalBankTransactions - confirmedMatches,
      averageConfidence,
      reconciliationRate: totalSales > 0 ? (confirmedMatches / totalSales) * 100 : 0,
    };
  }
}
