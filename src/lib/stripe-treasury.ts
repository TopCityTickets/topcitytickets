import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

export interface TreasuryAccount {
  financialAccountId: string;
  accountId: string;
  status: string;
  balance: {
    available: number;
    pending: number;
    currency: string;
  };
}

export class StripeTreesuryService {
  /**
   * Create a financial account for a connected account
   */
  async createFinancialAccount(connectedAccountId: string, platformId?: string): Promise<string> {
    try {
      const financialAccount = await stripe.treasury.financialAccounts.create({
        supported_currencies: ['usd'],
        features: {
          card_issuing: { requested: false },
          deposit_insurance: { requested: false },
          financial_addresses: { aba: { requested: false } },
          inbound_transfers: { ach: { requested: true } },
          intra_stripe_flows: { requested: true },
          outbound_payments: {
            ach: { requested: true },
            us_domestic_wire: { requested: false }
          },
          outbound_transfers: {
            ach: { requested: true },
            us_domestic_wire: { requested: false }
          }
        },
        metadata: {
          connected_account_id: connectedAccountId,
          platform_id: platformId || 'topcitytickets',
          purpose: 'escrow_and_payouts'
        }
      }, {
        stripeAccount: connectedAccountId
      });

      return financialAccount.id;
    } catch (error) {
      console.error('Error creating financial account:', error);
      throw new Error(`Failed to create financial account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get financial account details
   */
  async getFinancialAccount(financialAccountId: string, connectedAccountId: string): Promise<TreasuryAccount> {
    try {
      const financialAccount = await stripe.treasury.financialAccounts.retrieve(
        financialAccountId,
        { stripeAccount: connectedAccountId }
      );

      return {
        financialAccountId: financialAccount.id,
        accountId: connectedAccountId,
        status: financialAccount.status,
        balance: {
          available: financialAccount.balance.cash?.usd || 0,
          pending: financialAccount.balance.outbound_pending?.usd || 0,
          currency: 'usd'
        }
      };
    } catch (error) {
      console.error('Error fetching financial account:', error);
      throw new Error(`Failed to fetch financial account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create an inbound transfer to move funds into a financial account
   */
  async createInboundTransfer(
    financialAccountId: string,
    connectedAccountId: string,
    amount: number,
    originPaymentMethodId: string,
    currency: string = 'usd'
  ): Promise<string> {
    try {
      const inboundTransfer = await stripe.treasury.inboundTransfers.create({
        financial_account: financialAccountId,
        amount: amount,
        currency: currency,
        origin_payment_method: originPaymentMethodId
      }, {
        stripeAccount: connectedAccountId
      });

      return inboundTransfer.id;
    } catch (error) {
      console.error('Error creating inbound transfer:', error);
      throw new Error(`Failed to create inbound transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create an outbound transfer to move funds from a financial account
   */
  async createOutboundTransfer(
    financialAccountId: string,
    connectedAccountId: string,
    amount: number,
    currency: string = 'usd'
  ): Promise<string> {
    try {
      const outboundTransfer = await stripe.treasury.outboundTransfers.create({
        financial_account: financialAccountId,
        destination_payment_method_data: {
          type: 'financial_account'
        },
        amount: amount,
        currency: currency
      }, {
        stripeAccount: connectedAccountId
      });

      return outboundTransfer.id;
    } catch (error) {
      console.error('Error creating outbound transfer:', error);
      throw new Error(`Failed to create outbound transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List transactions for a financial account
   */
  async listFinancialAccountTransactions(
    financialAccountId: string,
    connectedAccountId: string,
    limit: number = 10
  ) {
    try {
      const transactions = await stripe.treasury.transactions.list({
        financial_account: financialAccountId,
        limit: limit
      }, {
        stripeAccount: connectedAccountId
      });

      return transactions.data;
    } catch (error) {
      console.error('Error listing transactions:', error);
      throw new Error(`Failed to list transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a connected account supports Treasury
   */
  async checkTreasuryCapability(connectedAccountId: string): Promise<boolean> {
    try {
      const account = await stripe.accounts.retrieve(connectedAccountId);
      return account.capabilities?.treasury === 'active';
    } catch (error) {
      console.error('Error checking Treasury capability:', error);
      return false;
    }
  }

  /**
   * Simulate received credit for testing (test mode only)
   */
  async simulateReceivedCredit(
    financialAccountId: string,
    connectedAccountId: string,
    amount: number,
    currency: string = 'usd'
  ): Promise<string> {
    try {
      if (!process.env.STRIPE_SECRET_KEY?.includes('sk_test_')) {
        throw new Error('Simulate received credit only available in test mode');
      }

      const receivedCredit = await stripe.testHelpers.treasury.receivedCredits.create({
        financial_account: financialAccountId,
        network: 'ach',
        amount: amount,
        currency: currency
      }, {
        stripeAccount: connectedAccountId
      });

      return receivedCredit.id;
    } catch (error) {
      console.error('Error simulating received credit:', error);
      throw new Error(`Failed to simulate received credit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const treasuryService = new StripeTreesuryService();
