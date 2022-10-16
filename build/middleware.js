"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IFTTT_SERVICE_KEY = process.env.IFTTT_SERVICE_KEY;
function serviceKeyCheck(req, res, next) {
    const key = req.get('IFTTT-Service-Key');
    if (key !== IFTTT_SERVICE_KEY) {
        res.status(401).send();
    }
    next();
}
exports.default = serviceKeyCheck;
