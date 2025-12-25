import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { client, writeClient } from "@/sanity/lib/client"
import { ORDER_BY_STRIPE_PAYMENT_ID_QUERY } from "@/sanity/queries/orders"

// Disable caching for webhook endpoint
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not defined")
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-12-15.clover"
  })
}

function getWebhookSecret() {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not defined")
  }
  return process.env.STRIPE_WEBHOOK_SECRET
}

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    )
  }

  const stripe = getStripe()
  const webhookSecret = getWebhookSecret()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error(`Webhook signature verification failed: ${message}`)
    return NextResponse.json(
      { error: `Webhook Error: ${message}`},
      { status: 400 }
    )
  }

  try {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutCompleted(session)
      break
    }
    default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error)
    // Return 500 so Stripe will retry
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const stripe = getStripe()
  const stripePaymentId = session.payment_intent as string

  console.log(`Processing checkout.session.completed for session: ${session.id}`)

  try {
    const existingOrder = await client.fetch(ORDER_BY_STRIPE_PAYMENT_ID_QUERY, {
      stripePaymentId
    })

    if (existingOrder) {
      console.log(`Order already exists for payment intent: ${stripePaymentId}`)
      return
    }

    const {
      clerkUserId,
      userEmail,
      sanityCustomerId,
      productIds: productIdsString,
      quantities: quantitiesString
    } = session.metadata ?? {}

    console.log("Session metadata:", {
      clerkUserId,
      userEmail,
      sanityCustomerId,
      productIds: productIdsString,
      quantities: quantitiesString
    })

    if (!clerkUserId || !productIdsString || !quantitiesString) {
      console.error("Missing required metadata in checkout session:", {
        hasClerkUserId: !!clerkUserId,
        hasProductIds: !!productIdsString,
        hasQuantities: !!quantitiesString,
        sessionId: session.id
      })
      throw new Error("Missing required metadata in checkout session")
    }

    const productIds = productIdsString.split(",")
    const quantities = quantitiesString.split(",").map(Number)

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id)

    const orderItems = productIds.map((productId, index) => ({
      _key: `item-${index}`,
      product: {
        _type: "reference" as const,
        _ref: productId
      },
      quantity: quantities[index],
      priceAtPurchase: lineItems.data[index]?.amount_total
        ? lineItems.data[index].amount_total / 100
        : 0
    }))

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    
    const shippingAddress = session.customer_details?.address
    const address = shippingAddress
      ? {
        name: session.customer_details?.name ?? "",
        line1: shippingAddress.line1 ?? "",
        line2: shippingAddress.line2 ?? "",
        city: shippingAddress.city ?? "",
        postcode: shippingAddress.postal_code ?? "",
        country: shippingAddress.country ?? ""
      }
      : undefined

    const order = await writeClient.create({
      _type: "order",
      orderNumber,
      ...(sanityCustomerId && {
        customer: {
          _type: "reference",
          _ref: sanityCustomerId
        }
      }),
      clerkUserId,
      email: userEmail ?? session.customer_details?.email ?? "",
      items: orderItems,
      total: (session.amount_total ?? 0) / 100,
      status: "paid",
      stripePaymentId,
      address,
      createdAt: new Date().toISOString()
    })

    console.log(`Order created successfully: ${order._id} (${orderNumber})`)

    // Update product stock
    await productIds
      .reduce(
        (tx, productId, i) => 
          tx.patch(productId, p => p.dec({ stock: quantities[i] })),
        writeClient.transaction()
      )
      .commit()

    console.log(`Stock updated for ${productIds.length} products`)
  } catch (error) {
    console.error(`Error handling checkout.session.completed:`, error)
    if (error instanceof Error) {
      console.error(`Error message: ${error.message}`)
      console.error(`Error stack: ${error.stack}`)
    }
    throw error
  }
}

