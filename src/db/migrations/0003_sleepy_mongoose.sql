ALTER TABLE "invoice" ADD COLUMN "client_phone" varchar(255);--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "delivery_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "total_product" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "total_product_amount" integer DEFAULT 0 NOT NULL;