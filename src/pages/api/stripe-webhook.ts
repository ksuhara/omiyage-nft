import { buffer } from 'micro'
import type { NextApiRequest, NextApiResponse } from 'next/types'
import randomstring from 'randomstring'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-08-01'
})

import initializeFirebaseServer from '../../configs/initFirebaseAdmin'

export const config = {
  api: {
    bodyParser: false
  }
}

export default async function stripeWebhook(req: NextApiRequest, res: NextApiResponse) {
  console.log('webhook')
  const sig = req.headers['stripe-signature'] as string

  const buf = await buffer(req)
  try {
    stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_ENDPOINT_SECRET || '')
  } catch (err: any) {
    console.log(err)

    return res.status(400).send(`Webhook Error: ${err.message}`)
  }
  const parsedBody = JSON.parse(buf.toString())
  const metadata = parsedBody.data.object.metadata
  const { db } = initializeFirebaseServer()
  const batch = db.batch()
  for (let i = 0; i < metadata.plan; i++) {
    const rand = randomstring.generate({
      length: 16,
      charset: 'alphanumeric',
      capitalization: 'lowercase'
    })
    const keysRef = db.collection(`chain/${metadata.chain}/contracts/${metadata.contractAddress}/keys`).doc(rand)

    batch.set(keysRef, {
      keyStatus: 'stock'
    })
  }

  await batch.commit()

  res.send(200)
}
