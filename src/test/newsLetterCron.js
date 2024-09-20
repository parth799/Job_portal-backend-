import cron from "node-cron";
import { User } from "../model/user.model.js";
import { Job } from "../model/job.model.js";
import { sendEmail } from "../utils/sendEmail.js";

const newsLetterCron = () => {
    cron.schedule("*/1 * * * *", async () => {
        console.log("Running cron automation!!");
        const jobs = await Job.find({ newsLettersSent: false });

        for (const job of jobs) {
            try {
                const users = await User.find({
                    $or: [
                        { "niches.firstNiche": job.jobNiche },
                        { "niches.secondNiche": job.jobNiche },
                        { "niches.thirdNiche": job.jobNiche },
                    ],
                });

                for (const user of users) {
                    const subject = `Hot Job Alert: ${job.title} in ${job.jobNiche} Available Now`;

                    await sendEmail({
                        email: user.email,
                        subject,
                        template: "jobAlertEmail.ejs",
                        templateData: {
                            user, 
                            job, 
                        },
                    });
                }

                job.newsLettersSent = true;
                await job.save();
            } catch (error) {
                console.log("ERROR IN NODE CRON CATCH BLOCK", error);
                return next(console.error(error || "Some error in Cron."));
            }
        }
    });
};

export { newsLetterCron };
