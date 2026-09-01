# 🔒 Security Policy — AudioGo

<p align="center">
  <a href="./SECURITY.md"><b>English</b></a> |
  <a href="./SECURITY.vi.md"><b>Tiếng Việt</b></a> |
  <a href="./SECURITY.zh-CN.md"><b>简体中文</b></a>
</p>

## Supported Versions

We provide security vulnerability patches for actively maintained branches:

| Version / Branch | Supported |
|---|---|
| Latest (`main`) | ✅ Full Support |
| Previous Releases | ⚠️ Critical Fixes Only |
| Beta / Pre-release | ❌ Unsupported |

---

## 🚨 Reporting a Vulnerability

**Please DO NOT report security vulnerabilities through public GitHub Issues.**  
Public disclosures may expose systems to exploitation before patches can be deployed.

### How to Report

**Option 1 (Recommended) — GitHub Private Vulnerability Reporting:**  
Use the [Report a vulnerability](../../security/advisories/new) feature directly on GitHub (requires login).

**Option 2 — Direct Security Email:**  
Send a detailed advisory directly to: 📧 **[quynhtien123123@gmail.com](mailto:quynhtien123123@gmail.com)**

### Information to Include

Please provide:
- Detailed **description** of the vulnerability and potential impact.
- Clear **steps to reproduce** (proof-of-concept scripts/payloads if available).
- **Affected component(s)** (API, Mobile App, Web CMS, SignalR, Database, etc.).
- Proposed **mitigation or remediation** (if you have one).
- Your contact information for coordination.

---

## ⏱️ Response & Disclosure Timelines

| Stage | Expected Timeline |
|---|---|
| Initial Acknowledgement | Within **48 hours** |
| Triage & Severity Assessment | Within **5 business days** |
| Remediation Plan & Target Date | Within **14 calendar days** |
| Public Patch Release | Based on CVSS Severity (see below) |

### Vulnerability Severity SLA

| Severity | CVSS v3 Score | Target Remediation Time |
|---|---|---|
| 🔴 **Critical** | 9.0 – 10.0 | ≤ 24 hours |
| 🟠 **High** | 7.0 – 8.9 | ≤ 7 calendar days |
| 🟡 **Medium** | 4.0 – 6.9 | ≤ 30 calendar days |
| 🟢 **Low** | 0.1 – 3.9 | Next scheduled minor release |

---

## 🏆 Responsible Disclosure Guidelines

- Give us reasonable time to investigate and release patches before disclosing publicly.
- Do not perform destructive testing that may degrade live services or compromise user privacy.
- We will gladly credit your name/handle in our Security Advisory release notes!
