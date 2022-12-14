import { ThirdwebSDK } from '@thirdweb-dev/sdk'
import type { NextApiRequest, NextApiResponse } from 'next/types'

import initializeFirebaseServer from '../../configs/initFirebaseAdmin'

export default async function generateMintSignature(req: NextApiRequest, res: NextApiResponse) {
  const { minterAddress, contractAddress, keyString, chain } = JSON.parse(req.body)
  const { db } = initializeFirebaseServer()

  const docRef = db.collection(`chain/${chain}/contracts/${contractAddress}/keys`).doc(keyString)
  const doc = await docRef.get()
  if (!doc.exists) {
    res.status(400).json({
      message: 'No such contract'
    })
  }
  const keyData = doc.data()

  const privKey = {
    polygon: process.env.ADMIN_PRIVATE_KEY_POLYGON || '',
    mumbai: process.env.ADMIN_PRIVATE_KEY || '',
    goerli: process.env.ADMIN_PRIVATE_KEY || ''
  }

  const SDK = ThirdwebSDK.fromPrivateKey(privKey[chain as 'polygon' | 'mumbai' | 'goerli'], chain)

  if (keyData?.keyStatus != 'signatured') {
    const edition = await SDK.getContract(contractAddress, 'edition')
    const mintSignature = await edition.signature.generateFromTokenId({
      tokenId: 0,
      quantity: 1,
      to: minterAddress
    })
    docRef.update({
      keyStatus: 'signatured',
      minterAddress
    })
    console.log('mintSignature')
    res.status(200).json(mintSignature)
  } else {
    res.status(400).json({
      message: 'key is already used'
    })
  }
}
