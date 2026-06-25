import { pgTable, index, foreignKey, text, timestamp, unique, boolean, uniqueIndex, uuid, integer, numeric, char, date, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const grade = pgEnum("grade", ['S235JR', 'DX51'])
export const orderStatus = pgEnum("order_status", ['MATCHED', 'APPROVED', 'PAID', 'DISPATCHED', 'DELIVERED', 'CANCELLED'])
export const shape = pgEnum("shape", ['SQUARE', 'RECTANGULAR', 'ROUND'])


export const member = pgTable("member", {
	id: text().primaryKey().notNull(),
	organizationId: text().notNull(),
	userId: text().notNull(),
	role: text().notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("member_organizationId_idx").using("btree", table.organizationId.asc().nullsLast().op("text_ops")),
	index("member_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "member_organizationId_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "member_userId_fkey"
		}).onDelete("cascade"),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean().notNull(),
	image: text(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	platformRole: text(),
}, (table) => [
	unique("user_email_key").on(table.email),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text().notNull(),
	activeOrganizationId: text(),
}, (table) => [
	index("session_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_fkey"
		}).onDelete("cascade"),
	unique("session_token_key").on(table.token),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text().notNull(),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp({ withTimezone: true, mode: 'string' }),
	refreshTokenExpiresAt: timestamp({ withTimezone: true, mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("account_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_fkey"
		}).onDelete("cascade"),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("verification_identifier_idx").using("btree", table.identifier.asc().nullsLast().op("text_ops")),
]);

export const organization = pgTable("organization", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	logo: text(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	metadata: text(),
	kind: text(),
}, (table) => [
	uniqueIndex("organization_slug_uidx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	unique("organization_slug_key").on(table.slug),
]);

export const invitation = pgTable("invitation", {
	id: text().primaryKey().notNull(),
	organizationId: text().notNull(),
	email: text().notNull(),
	role: text(),
	status: text().notNull(),
	expiresAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	inviterId: text().notNull(),
}, (table) => [
	index("invitation_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("invitation_organizationId_idx").using("btree", table.organizationId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "invitation_organizationId_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.inviterId],
			foreignColumns: [user.id],
			name: "invitation_inviterId_fkey"
		}).onDelete("cascade"),
]);

export const offer = pgTable("offer", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	barsAvailable: integer("bars_available").notNull(),
	grade: grade().notNull(),
	shape: shape().notNull(),
	width: numeric({ precision: 8, scale:  2 }).notNull(),
	height: numeric({ precision: 8, scale:  2 }).notNull(),
	thickness: numeric({ precision: 6, scale:  2 }).notNull(),
	barsPerBundle: integer("bars_per_bundle").notNull(),
	weightPerMeter: numeric("weight_per_meter", { precision: 8, scale:  4 }).notNull(),
	pricePerMeter: numeric("price_per_meter", { precision: 10, scale:  4 }).notNull(),
	currency: char({ length: 3 }).default('EUR').notNull(),
	notes: text(),
	userId: text("user_id").notNull(),
	organizationId: text("organization_id"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "offer_user_id_fkey"
		}),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "offer_organization_id_fkey"
		}),
]);

export const inquiry = pgTable("inquiry", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	barsRequested: integer("bars_requested").notNull(),
	latestDeliveryDate: date("latest_delivery_date"),
	grade: grade().notNull(),
	shape: shape().notNull(),
	width: numeric({ precision: 8, scale:  2 }).notNull(),
	height: numeric({ precision: 8, scale:  2 }).notNull(),
	thickness: numeric({ precision: 6, scale:  2 }).notNull(),
	notes: text(),
	userId: text("user_id").notNull(),
	organizationId: text("organization_id"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "inquiry_user_id_fkey"
		}),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "inquiry_organization_id_fkey"
		}),
]);

export const order = pgTable("order", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	status: orderStatus().default('MATCHED').notNull(),
	inquiryId: uuid("inquiry_id").notNull(),
	margin: numeric({ precision: 6, scale:  4 }).default('0').notNull(),
	notes: text(),
	userId: text("user_id").notNull(),
	organizationId: text("organization_id"),
}, (table) => [
	foreignKey({
			columns: [table.inquiryId],
			foreignColumns: [inquiry.id],
			name: "order_inquiry_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "order_user_id_fkey"
		}),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "order_organization_id_fkey"
		}),
]);

export const orderOffer = pgTable("order_offer", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	offerId: uuid("offer_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [order.id],
			name: "order_offer_order_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.offerId],
			foreignColumns: [offer.id],
			name: "order_offer_offer_id_fkey"
		}),
	unique("order_offer_order_id_offer_id_key").on(table.orderId, table.offerId),
]);

// ── Inferred row + insert types — the client/server type-sharing surface.
// Derived from the tables above, so they cannot drift from the schema.
export type Inquiry = typeof inquiry.$inferSelect;
export type NewInquiry = typeof inquiry.$inferInsert;
export type Offer = typeof offer.$inferSelect;
export type NewOffer = typeof offer.$inferInsert;
export type Order = typeof order.$inferSelect;
export type NewOrder = typeof order.$inferInsert;
export type OrderOffer = typeof orderOffer.$inferSelect;
export type User = typeof user.$inferSelect;
export type Organization = typeof organization.$inferSelect;
export type Member = typeof member.$inferSelect;
