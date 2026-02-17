# 📘 JUDOL: Journal of Underlying Decentralized Open Ledgers

![JUDOL Banner](judol-fe/public/logo.png)

> **DeSci Platform turning Academic Papers into Liquid Assets on Arbitrum.**
> Built for the **Arbitrum Open House NYC: Online Buildathon**.

![License](https://img.shields.io/badge/License-MIT-green)
![Arbitrum Sepolia](https://img.shields.io/badge/Built%20on-Arbitrum%20Sepolia-blue)

## 🚀 Live Demo
**🌐 Visit the App: [https://judol.netlify.app](https://judol.netlify.app)**

---

## 🧐 The Problem
The academic publishing industry is broken:
1.  **Predatory Journals:** Researchers pay high APC (*Article Processing Charges*) but lose copyright ownership.
2.  **Zero Royalties:** Authors rarely earn from citations or downloads.
3.  **Wasted Data:** "Negative results" or failed experiments are discarded, wasting valuable training data for AI models.
4.  **Slow Review:** Peer review takes months, often blocked by bias.

## 💡 The Solution
**JUDOL** utilizes **Arbitrum Sepolia** with USDC payments to create an on-chain reputation economy for researchers. We treat academic papers and datasets as tokenized assets.

### Core Features:
* **📄 Mint Research as Assets:** Researchers upload PDFs to IPFS (via Pinata) and mint them as assets on Arbitrum with USDC.
* **🤖 AI Agent Pre-Screening:** Submissions are analyzed by AI for plagiarism, structure, and novelty (SINTA Score prediction) before human review.
* **⚖️ DAO Governance:** Verified experts (SINTA 1-2) vote to approve/reject papers.
* **💰 Payments & Monetization:**
    * **Verified Papers:** Get published and receive USDC payments from readers/institutions.
    * **Data Pool:** Rejected papers become "Data Assets" for training AI models (monetizing failure).
* **🎨 Neo-Brutalist UI:** A raw, honest, and bold design language emphasizing transparency.

### 🔄 Protocol Flow

<div align="center">
  <img width="800" alt="JUDOL Protocol Flow" src="https://indigo-legislative-mackerel-269.mypinata.cloud/ipfs/bafkreihwbqaxgujeusvn2r7mhvheu3pxv4js27dpa4cczoogcr43wkpbsy" />
</div>

---

## 🛠️ Tech Stack

| Category | Technology | Usage |
| :--- | :--- | :--- |
| **Blockchain** | **Arbitrum Sepolia Testnet** | Asset Registration, USDC Payments |
| **Framework** | **React + Vite** | Frontend Core |
| **Language** | **TypeScript** | Type Safety |
| **Styling** | **Tailwind CSS** | Neo-Brutalist Design System |
| **Components** | **Shadcn/UI** | Accessible UI Components |
| **Web3** | **Wagmi + RainbowKit** | Wallet Connection & Signing |
| **Storage** | **Pinata (IPFS)** | Decentralized PDF & Metadata Storage |
| **Deployment** | **Netlify** | CI/CD & Hosting |

---

## 📸 Screenshots

| **Home & Hero** | **Explore Graph** |
|:---:|:---:|
| <img src="https://indigo-legislative-mackerel-269.mypinata.cloud/ipfs/bafkreie2a7efgtc3edbaagxwtungxiyuv43qmtfkzcg2zetwlegbtkcxri" alt="Home & Hero" /> | <img src="https://indigo-legislative-mackerel-269.mypinata.cloud/ipfs/bafkreifiarcagrydzw6kmwvugoum5nqv4h5swf7m6wgmtvi5t35j6xq6mu" alt="Explore Graph" /> |

| **Reviewer Hub** | **Minting Wizard** |
|:---:|:---:|
| <img src="https://indigo-legislative-mackerel-269.mypinata.cloud/ipfs/bafkreibmhez7upcl5noz6jwd2raq6ecprofvxucfdff2ghv32bfkhmvwfm" alt="Reviewer Hub" /> | <img src="https://github.com/user-attachments/assets/e7c3b181-01b3-4587-a62d-0e532e4818a5" alt="Minting Wizard" /> |

---

## 🏗️ Local Development

Follow these steps to run JUDOL on your local machine:

### 1. Clone the Repository
```bash
git clone [https://github.com/weisscurry/judol-fe.git](https://github.com/weisscurry/judol-fe.git)
cd judol-fe
