-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_description" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "winner_candidate_id" TEXT,
    "winner_announced" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nomination" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "proposed_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Nomination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "used_in_nomination" BOOLEAN NOT NULL DEFAULT false,
    "used_in_voting" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventState" (
    "id" TEXT NOT NULL DEFAULT '1',
    "state" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_winner_candidate_id_key" ON "Category"("winner_candidate_id");

-- CreateIndex
CREATE INDEX "Category_order_idx" ON "Category"("order");

-- CreateIndex
CREATE INDEX "Category_is_active_idx" ON "Category"("is_active");

-- CreateIndex
CREATE INDEX "Nomination_category_id_idx" ON "Nomination"("category_id");

-- CreateIndex
CREATE INDEX "Nomination_created_at_idx" ON "Nomination"("created_at");

-- CreateIndex
CREATE INDEX "Candidate_category_id_idx" ON "Candidate"("category_id");

-- CreateIndex
CREATE INDEX "Candidate_is_active_idx" ON "Candidate"("is_active");

-- CreateIndex
CREATE INDEX "Vote_category_id_idx" ON "Vote"("category_id");

-- CreateIndex
CREATE INDEX "Vote_candidate_id_idx" ON "Vote"("candidate_id");

-- CreateIndex
CREATE INDEX "Vote_created_at_idx" ON "Vote"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "MemberCode_code_key" ON "MemberCode"("code");

-- CreateIndex
CREATE INDEX "MemberCode_code_idx" ON "MemberCode"("code");

-- CreateIndex
CREATE INDEX "MemberCode_used_in_nomination_idx" ON "MemberCode"("used_in_nomination");

-- CreateIndex
CREATE INDEX "MemberCode_used_in_voting_idx" ON "MemberCode"("used_in_voting");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_winner_candidate_id_fkey" FOREIGN KEY ("winner_candidate_id") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nomination" ADD CONSTRAINT "Nomination_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

