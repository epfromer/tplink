import { Request, Response, NextFunction } from 'express'

const IFTTT_SERVICE_KEY = process.env.IFTTT_SERVICE_KEY

export default function serviceKeyCheck(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const key = req.get('IFTTT-Service-Key')

  if (key !== IFTTT_SERVICE_KEY) {
    console.error('serviceKeyCheck fail', key, IFTTT_SERVICE_KEY)
    res.status(401).send()
  }

  next()
}
