CREATE TABLE IF NOT EXISTS "revolut_auth" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"token_expires_at" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "revolut_auth_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE IF NOT EXISTS "bank_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"revolut_account_id" varchar(100) NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"balance" numeric(20, 4) DEFAULT 0 NOT NULL,
	"currency" varchar(3) DEFAULT 'GBP' NOT NULL,
	"account_number" varchar(50),
	"sort_code" varchar(20),
	"iban" varchar(50),
	"is_active" boolean DEFAULT true,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bank_accounts_revolut_account_id_unique" UNIQUE("revolut_account_id")
);

CREATE TABLE IF NOT EXISTS "bank_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"revolut_transaction_id" varchar(100) NOT NULL,
	"account_id" integer,
	"user_id" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"direction" varchar(10) NOT NULL,
	"amount" numeric(20, 4) NOT NULL,
	"currency" varchar(3) DEFAULT 'GBP' NOT NULL,
	"fee" numeric(20, 4) DEFAULT 0,
	"description" text,
	"counter_party" varchar(255),
	"counter_party_account" varchar(100),
	"reference" varchar(255),
	"category" varchar(100),
	"subcategory" varchar(100),
	"merchant_name" varchar(255),
	"merchant_city" varchar(100),
	"merchant_country" varchar(100),
	"merchant_category_code" varchar(10),
	"tags" text[],
	"notes" text,
	"balance_before" numeric(20, 4),
	"balance_after" numeric(20, 4),
	"transaction_date" timestamp NOT NULL,
	"settled_date" timestamp,
	"is_pending" boolean DEFAULT false,
	"is_recurring" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bank_transactions_revolut_transaction_id_unique" UNIQUE("revolut_transaction_id")
);

CREATE TABLE IF NOT EXISTS "investments" (
	"id" serial PRIMARY KEY NOT NULL,
	"revolut_investment_id" varchar(100) NOT NULL,
	"user_id" text NOT NULL,
	"ticker" varchar(20),
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"quantity" numeric(20, 8) DEFAULT 0 NOT NULL,
	"average_buy_price" numeric(20, 4),
	"current_price" numeric(20, 4),
	"currency" varchar(3) DEFAULT 'GBP' NOT NULL,
	"total_cost" numeric(20, 4),
	"total_value" numeric(20, 4),
	"pl" numeric(20, 4),
	"pl_percent" double precision,
	"exchange_code" varchar(20),
	"is_active" boolean DEFAULT true,
	"last_price_updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "investments_revolut_investment_id_unique" UNIQUE("revolut_investment_id")
);

CREATE TABLE IF NOT EXISTS "investment_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"revolut_order_id" varchar(100) NOT NULL,
	"investment_id" integer,
	"user_id" text NOT NULL,
	"type" varchar(20) NOT NULL,
	"quantity" numeric(20, 8) NOT NULL,
	"price" numeric(20, 4) NOT NULL,
	"total" numeric(20, 4) NOT NULL,
	"fee" numeric(20, 4) DEFAULT 0,
	"currency" varchar(3) DEFAULT 'GBP' NOT NULL,
	"status" varchar(20) DEFAULT 'executed' NOT NULL,
	"executed_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "investment_transactions_revolut_order_id_unique" UNIQUE("revolut_order_id")
);

CREATE TABLE IF NOT EXISTS "spending_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" varchar(100) NOT NULL,
	"icon" varchar(50),
	"color" varchar(20),
	"budget" numeric(20, 4) DEFAULT 0,
	"period" varchar(20) DEFAULT 'monthly',
	"is_system" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
