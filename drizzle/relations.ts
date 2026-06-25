import { relations } from "drizzle-orm/relations";
import { organization, member, user, session, account, invitation, offer, inquiry, order, orderOffer } from "./schema";

export const memberRelations = relations(member, ({one}) => ({
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [member.userId],
		references: [user.id]
	}),
}));

export const organizationRelations = relations(organization, ({many}) => ({
	members: many(member),
	invitations: many(invitation),
	offers: many(offer),
	inquiries: many(inquiry),
	orders: many(order),
}));

export const userRelations = relations(user, ({many}) => ({
	members: many(member),
	sessions: many(session),
	accounts: many(account),
	invitations: many(invitation),
	offers: many(offer),
	inquiries: many(inquiry),
	orders: many(order),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const invitationRelations = relations(invitation, ({one}) => ({
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [invitation.inviterId],
		references: [user.id]
	}),
}));

export const offerRelations = relations(offer, ({one, many}) => ({
	user: one(user, {
		fields: [offer.userId],
		references: [user.id]
	}),
	organization: one(organization, {
		fields: [offer.organizationId],
		references: [organization.id]
	}),
	orderOffers: many(orderOffer),
}));

export const inquiryRelations = relations(inquiry, ({one, many}) => ({
	user: one(user, {
		fields: [inquiry.userId],
		references: [user.id]
	}),
	organization: one(organization, {
		fields: [inquiry.organizationId],
		references: [organization.id]
	}),
	orders: many(order),
}));

export const orderRelations = relations(order, ({one, many}) => ({
	inquiry: one(inquiry, {
		fields: [order.inquiryId],
		references: [inquiry.id]
	}),
	user: one(user, {
		fields: [order.userId],
		references: [user.id]
	}),
	organization: one(organization, {
		fields: [order.organizationId],
		references: [organization.id]
	}),
	orderOffers: many(orderOffer),
}));

export const orderOfferRelations = relations(orderOffer, ({one}) => ({
	order: one(order, {
		fields: [orderOffer.orderId],
		references: [order.id]
	}),
	offer: one(offer, {
		fields: [orderOffer.offerId],
		references: [offer.id]
	}),
}));