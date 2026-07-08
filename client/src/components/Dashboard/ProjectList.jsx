import React from 'react';
import { FolderKanban, Plus, Edit, Trash2, Users, Calendar } from 'lucide-react';

const ProjectList = ({ 
  projects, 
  onAdd, 
  onEdit, 
  onDelete, 
  isDark 
}) => {
  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={`rounded-xl border ${
      isDark ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'
    }`}>
      <div className={`px-6 py-4 border-b flex justify-between items-center ${
        isDark ? 'border-zinc-800' : 'border-zinc-200'
      }`}>
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <FolderKanban size={16} className="text-indigo-500" />
          <span>Projects / Categories</span>
        </h2>
        <button
          onClick={onAdd}
          className="btn-primary-glow text-xs py-1.5 px-3 flex items-center gap-1.5"
        >
          <Plus size={14} />
          <span>Add Project</span>
        </button>
      </div>
      
      <div className="p-6">
        {projects.length === 0 ? (
          <p className="text-zinc-500 text-center py-4 text-xs font-medium">No projects found. Add your first project!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => {
              const startDate = formatDate(project.startDate);
              const endDate = formatDate(project.endDate);
              const memberCount = project.assignedMembers?.length || 0;

              return (
                <div 
                  key={project._id} 
                  className={`rounded-xl border p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:shadow-md ${
                    isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-white border-zinc-200'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-xs tracking-tight">{project.name}</h3>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => onEdit(project)}
                          className={`p-1.5 rounded hover:bg-zinc-850 cursor-pointer transition-colors ${
                            isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-650 hover:text-zinc-800'
                          }`}
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => onDelete(project._id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-red-400 cursor-pointer transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <p className={`text-[11px] leading-relaxed line-clamp-2 ${isDark ? 'text-zinc-400' : 'text-zinc-650'}`}>
                      {project.description || 'No description provided.'}
                    </p>

                    {/* Project Timeline */}
                    {(startDate || endDate) && (
                      <div className={`flex items-center gap-1.5 mt-2 text-[9px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        <Calendar size={10} />
                        <span>
                          {startDate || 'Start'} → {endDate || 'Ongoing'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {/* Assigned Members */}
                    {memberCount > 0 && (
                      <div className={`flex items-center gap-1.5 text-[9px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        <Users size={10} />
                        <span>{memberCount} member{memberCount !== 1 ? 's' : ''} assigned</span>
                      </div>
                    )}

                    <div className={`flex justify-between items-center border-t pt-2.5 ${isDark ? 'border-zinc-800' : 'border-zinc-250'}`}>
                      <span className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
                      }`}>
                        {project.category}
                      </span>
                      <span className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                        project.status === 'Active' 
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/60' 
                          : 'bg-zinc-850 text-zinc-400 border border-zinc-700'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
