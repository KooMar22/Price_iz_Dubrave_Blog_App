-- CreateIndex
CREATE INDEX "posts_user_id_is_posted_idx" ON "posts"("user_id", "is_posted");

-- CreateIndex
CREATE INDEX "posts_created_at_idx" ON "posts"("created_at");
