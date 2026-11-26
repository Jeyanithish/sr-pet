# SR Pet World — Beginner Guide to AWS & Razorpay Deployment

This guide walks you through deploying **SR Pet World** from scratch on **Amazon Web Services (AWS)** with **Razorpay** payments in India (`INR ₹`).

---

## 1. Amazon RDS (PostgreSQL 16 Database)

1. Sign in to the **AWS Console** and select region **Asia Pacific (Mumbai) `ap-south-1`** for lowest latency in India.
2. Open **RDS → Databases → Create database**.
3. Choose:
   * **Engine:** PostgreSQL (version 16.x)
   * **Template:** Free tier
   * **DB instance identifier:** `sr-pet-world-db`
   * **Master username:** `sradmin`
   * **Master password:** Create a strong password and save it safely.
   * **Instance configuration:** `db.t4g.micro` or `db.t3.micro`
   * **Initial database name** (under *Additional configuration*): `sr_pet_world`
   * **Public access:** `No` if using VPC peering, or `Yes` during initial testing (restrict Security Group inbound rule on port `5432` to your backend / IP).
4. Once status becomes **Available**, copy the **Endpoint** (e.g. `sr-pet-world-db.xxxx.ap-south-1.rds.amazonaws.com`).
5. Your JDBC URL will be:
   ```text
   jdbc:postgresql://<RDS-ENDPOINT>:5432/sr_pet_world
   ```
   > **Note:** Flyway (`V1__init_schema.sql` and `V2__seed_data.sql`) runs automatically when Spring Boot starts—no manual SQL import needed.

---

## 2. Amazon S3 (Bird Photo Storage)

1. Open **S3 → Create bucket**.
2. **Bucket name:** e.g. `sr-pet-world-media-prod` (must be globally unique).
3. **Region:** `ap-south-1` (Mumbai).
4. **Block Public Access:** Uncheck *Block all public access* if you want direct S3 public image URLs, and add a read-only Bucket Policy for `s3:GetObject` on `arn:aws:s3:::sr-pet-world-media-prod/birds/*`.
5. Attach an IAM role/policy to your backend runtime granting `s3:PutObject` on `arn:aws:s3:::sr-pet-world-media-prod/*`.

---

## 3. Backend on AWS App Runner (Docker Container)

1. Push your repository to **GitHub**.
2. Push the `backend/Dockerfile` image to **Amazon ECR** (or connect App Runner directly if using ECR):
   ```bash
   aws ecr create-repository --repository-name sr-pet-world-backend --region ap-south-1
   docker build -t sr-pet-world-backend ./backend
   docker tag sr-pet-world-backend:latest <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/sr-pet-world-backend:latest
   docker push <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/sr-pet-world-backend:latest
   ```
3. In **AWS App Runner → Create service**:
   * **Source:** Container registry (Amazon ECR) → select your image.
   * **Port:** `8080`
   * **Health check:** HTTP `/actuator/health`
4. Add these **Environment Variables** in App Runner:
   * `SPRING_PROFILES_ACTIVE=prod`
   * `DB_URL=jdbc:postgresql://<RDS-ENDPOINT>:5432/sr_pet_world`
   * `DB_USERNAME=sradmin`
   * `DB_PASSWORD=<YOUR_DB_PASSWORD>`
   * `JWT_SECRET=<RANDOM_64_CHAR_SECRET>`
   * `RAZORPAY_KEY_ID=<YOUR_RAZORPAY_KEY_ID>`
   * `RAZORPAY_KEY_SECRET=<YOUR_RAZORPAY_KEY_SECRET>`
   * `RAZORPAY_WEBHOOK_SECRET=<YOUR_RAZORPAY_WEBHOOK_SECRET>`
   * `AWS_S3_BUCKET=sr-pet-world-media-prod`
   * `AWS_REGION=ap-south-1`
   * `CORS_ALLOWED_ORIGINS=https://<YOUR-AMPLIFY-DOMAIN>.amplifyapp.com`
5. Deploy and copy your App Runner HTTPS URL (e.g. `https://xxxx.ap-south-1.awsapprunner.com`).

---

## 4. Frontend on AWS Amplify (React + TypeScript)

1. Open **AWS Amplify → Host web app → GitHub**.
2. Select your repository and branch (`main`).
3. Amplify automatically detects `frontend/amplify.yml`.
4. Under **Environment variables**, add:
   * `VITE_API_BASE_URL=https://<YOUR-APP-RUNNER-DOMAIN>`
5. Click **Save and deploy**. Amplify provides automatic HTTPS and a live `.amplifyapp.com` URL.
6. Copy that Amplify URL and update `CORS_ALLOWED_ORIGINS` in App Runner if you didn't have it yet.

---

## 5. Razorpay Go-Live Checklist

1. **Test Mode First:**
   * Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/) → switch to **Test Mode**.
   * Generate **Test API Keys** (`rzp_test_...`) and set them in App Runner.
   * Test a full checkout using Razorpay test UPI (`success@razorpay`) or test card.
2. **Register Live Website:**
   * Complete Razorpay KYC and add your live Amplify domain (`https://<your-domain>.amplifyapp.com`) in Razorpay Account Settings.
3. **Configure Webhook:**
   * In Razorpay Dashboard → **Developers → Webhooks → Add New Webhook**:
     * **Webhook URL:** `https://<YOUR-APP-RUNNER-DOMAIN>/api/payments/webhook`
     * **Secret:** Set a strong secret and copy it to `RAZORPAY_WEBHOOK_SECRET` in App Runner.
     * **Active Events:** Check `payment.captured` and `payment.failed`.
4. **Switch to Live Mode:**
   * Switch Razorpay Dashboard to **Live Mode**, generate **Live API Keys** (`rzp_live_...`), and update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in App Runner.
