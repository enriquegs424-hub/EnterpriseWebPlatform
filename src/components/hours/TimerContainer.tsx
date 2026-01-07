import { getAllProjects } from "@/app/admin/actions";
import TimerWrapper from "@/components/hours/TimerWrapper";

export default async function TimerContainer() {
    const projects = await getAllProjects();
    const activeProjects = projects.filter(p => p.isActive);

    return <TimerWrapper projects={activeProjects} />;
}
