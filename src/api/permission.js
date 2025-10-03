import { WEBSITE_URL } from '@/config/dict'
import { dealLog } from '@/utils/log-util.js'
import {
  MIGRATION_SIMPLE_FLOW,
  REDEEM_URL,
  LICENSE_STATUS_URL,
  CHECKOUT_LOOKUP_URL,
  REDEEM_AUTH_HEADER_KEY,
  REDEEM_AUTH_HEADER_VALUE,
  REDEEM_AUTH_HEADER_2_KEY,
  REDEEM_AUTH_HEADER_2_VALUE
} from '@/service/constants'

// ---- Supabase wrappers (novo fluxo) ----
export async function redeemCode({ code, whatsapp, email }) {
  const body = { code: (code ?? '').trim() }
  // o backend espera "whatsapp_number"
  if (whatsapp) body.whatsapp_number = whatsapp
  if (email) body.email = email

  const headers = { 'Content-Type': 'application/json' }
  if (REDEEM_AUTH_HEADER_KEY && REDEEM_AUTH_HEADER_VALUE) {
    headers[REDEEM_AUTH_HEADER_KEY] = REDEEM_AUTH_HEADER_VALUE
  }
  if (REDEEM_AUTH_HEADER_2_KEY && REDEEM_AUTH_HEADER_2_VALUE) {
    headers[REDEEM_AUTH_HEADER_2_KEY] = REDEEM_AUTH_HEADER_2_VALUE
  }

  const r = await fetch(REDEEM_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })
  const data = await r.json().catch(() => ({}))
  const ok = r.ok && data?.ok === true
  return { ok, data, status: r.status }
}

export async function getLicenseStatus({ whatsapp, email }) {
  const qs = new URLSearchParams(whatsapp ? { whatsapp } : (email ? { email } : {}))
  const r = await fetch(`${LICENSE_STATUS_URL}?${qs.toString()}`, { method: 'GET' })
  const data = await r.json().catch(() => ({}))
  return { ok: r.ok, data, status: r.status }
}

export async function lookupCheckout(session_id) {
  const url = `${CHECKOUT_LOOKUP_URL}?session_id=${encodeURIComponent(session_id)}`
  const r = await fetch(url, { method: 'GET' })
  const data = await r.json().catch(() => ({}))
  return { ok: r.ok, data, status: r.status }
}

// ---- Legado (mantido para fallback) ----

// 插件共用路径
// 测试
// const ALL_EXTENSION_URL = 'https://sender.watechdev.asia/api/extension/'
// 生产
const ALL_EXTENSION_URL = 'https://wawebsender.com/api/extension/'

async function permissionActiveCodeList(transaction_id) {
  if (MIGRATION_SIMPLE_FLOW) {
    return { code: 0, message: 'Legacy active code list disabled in simple flow.' }
  }
  try {
    let responseData = await fetch(WEBSITE_URL + 'permission/active-code-list/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { transaction_id: transaction_id } // legado mantido
    }).then((res) => {
      if (res.status !== 200) {
        dealLog({ eventType: 900014, otherParams: { url: res.url, status: res.status } })
      }
      return res.json()
    })
    return responseData
  } catch (e) {
    console.log(e)
  }
}

async function permissionInfo(whatsapp_number, transaction_id) {
  try {
    let time = new Date().getTime()
    let responseData = await fetch(WEBSITE_URL + 'permission/info/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version: '1.0.1',
        transaction_id: transaction_id,
        whatsapp_number: whatsapp_number,
        time: time
      })
    }).then((res) => {
      if (res.status !== 200) {
        dealLog({ eventType: 900014, otherParams: { url: res.url, status: res.status } })
      }
      return res.json()
    })
    return responseData
  } catch (e) {
    console.log(e)
  }
}

async function permissionSync(whatsapp_number) {
  try {
    let responseData = await fetch(WEBSITE_URL + 'permission/sync/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: '1.0.1', whatsapp_number: whatsapp_number })
    }).then((res) => {
      if (res.status !== 200) {
        dealLog({ eventType: 900014, otherParams: { url: res.url, status: res.status } })
      }
      return res.json()
    })
    return responseData
  } catch (e) {
    console.log(e)
  }
}

async function permissionCheck(whatsapp_number, active_code) {
  if (MIGRATION_SIMPLE_FLOW) {
    const { ok, data } = await redeemCode({ code: active_code, whatsapp: whatsapp_number })
    if (ok) {
      return { code: 100000, data }
    }
    return {
      code: data?.code ?? 0,
      message: data?.message || data?.error || 'Activation failed',
      data
    }
  }
  try {
    let responseData = await fetch(WEBSITE_URL + 'permission/check/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active_code: active_code, whatsapp_number: whatsapp_number })
    }).then((res) => {
      if (res.status !== 200) {
        dealLog({ eventType: 900014, otherParams: { url: res.url, status: res.status } })
      }
      return res.json()
    })
    return responseData
  } catch (e) {
    console.log(e)
  }
}

async function getTransactionInfo(transaction_id) {
  if (MIGRATION_SIMPLE_FLOW) {
    return { code: 0, message: 'Legacy transaction lookup disabled in simple flow.' }
  }
  try {
    let responseData = await fetch(WEBSITE_URL + 'get-transaction-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: transaction_id })
    }).then((res) => {
      if (res.status !== 200) {
        dealLog({ eventType: 900014, otherParams: { url: res.url, status: res.status } })
      }
      return res.json()
    })
    return responseData
  } catch (e) {
    console.log(e)
  }
}

async function cancelTransaction(transaction_id, email) {
  if (MIGRATION_SIMPLE_FLOW) {
    return { code: 0, message: 'Legacy cancel disabled in simple flow.' }
  }
  try {
    let responseData = await fetch(WEBSITE_URL + 'transaction/cancel/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: transaction_id, email: email })
    }).then((res) => {
      if (res.status !== 200) {
        dealLog({ eventType: 900014, otherParams: { url: res.url, status: res.status } })
      }
      return res.json()
    })
    return responseData
  } catch (e) {
    console.log(e)
  }
}

// 获取支付链接接口
async function getPayUrl(plink_id, whatsapp_number, is_renew) {
  if (MIGRATION_SIMPLE_FLOW) {
    return {
      code: 0,
      message: 'Checkout handled externally. Use the plans page.',
      data: null
    }
  }
  try {
    let responseData = await fetch(WEBSITE_URL + 'transaction/pay-link/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plink_id: plink_id,
        whatsapp_number: whatsapp_number,
        is_renew: is_renew
      })
    }).then((res) => {
      if (res.status !== 200) {
        dealLog({ eventType: 900014, otherParams: { url: res.url, status: res.status } })
      }
      return res.json()
    })
    return responseData
  } catch (e) {
    console.log(e)
  }
}

async function checkNewUserGuide(params) {
  if (MIGRATION_SIMPLE_FLOW) {
    return { code: 0, message: 'Legacy guide check disabled in simple flow.' }
  }
  try {
    let responseData = await fetch(ALL_EXTENSION_URL + 'permission/check-new-user-guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params })
    }).then((res) => {
      if (res.status !== 200) {
        dealLog({ eventType: 150014, otherParams: { url: res.url, status: res.status } })
      }
      return res.json()
    })
    return responseData
  } catch (e) {
    console.log(e)
  }
}

export {
  permissionActiveCodeList,
  permissionInfo,
  permissionCheck,
  getTransactionInfo,
  permissionSync,
  cancelTransaction,
  getPayUrl,
  checkNewUserGuide,
  // novos wrappers
  redeemCode,
  getLicenseStatus,
  lookupCheckout
}
