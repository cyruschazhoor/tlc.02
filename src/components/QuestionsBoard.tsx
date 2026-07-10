/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Question, User, Reply } from '../types';
import { db } from '../lib/db';
import { MessageSquare, Search, PlusCircle, BookOpen, ThumbsUp, Send, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface QuestionsBoardProps {
  questions: Question[];
  currentUser: User | null;
  onQuestionAdded: (questions: Question[]) => void;
  onOpenAuth: () => void;
}

export default function QuestionsBoard({
  questions,
  currentUser,
  onQuestionAdded,
  onOpenAuth
}: QuestionsBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All');
  const [showAskForm, setShowAskForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSubject, setNewSubject] = useState('Algebra');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  const subjects = ['All', 'Algebra', 'Calculus', 'Chemistry', 'Biology', 'Physics', 'SAT Prep', 'Computer Science'];

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubjectFilter === 'All' || q.subject === selectedSubjectFilter;
    return matchesSearch && matchesSubject;
  });

  const handleAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      await db.addQuestion(
        newTitle,
        newContent,
        newSubject,
        currentUser.id,
        currentUser.fullName
      );
      
      // Refresh questions list from database
      const updated = await db.getQuestions();
      onQuestionAdded(updated);

      // Reset form
      setNewTitle('');
      setNewContent('');
      setShowAskForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async (e: React.MouseEvent, questionId: string) => {
    e.stopPropagation();
    const currentLikes = await db.likeQuestion(questionId);
    if (currentLikes) {
      const updated = await db.getQuestions();
      onQuestionAdded(updated);
    }
  };

  const handleAddReply = async (e: React.FormEvent, questionId: string) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const text = replyText[questionId] || '';
    if (!text.trim()) return;

    try {
      const role = currentUser.role;
      await db.addReply(questionId, currentUser.fullName, role, text);
      
      // Refresh questions list
      const updated = await db.getQuestions();
      onQuestionAdded(updated);

      // Clear input
      setReplyText((prev) => ({ ...prev, [questionId]: '' }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-serif font-bold text-[#2D3A30] tracking-tight flex items-center gap-2">
            <span className="p-1.5 bg-[#5F7161]/10 border border-[#5F7161]/25 rounded-xl">
              <MessageSquare className="w-5 h-5 text-[#5F7161]" />
            </span>
            Doubts & Questions Board
          </h3>
          <p className="text-xs text-[#9A9483] font-bold mt-1">
            Stuck on a tricky problem? Post your question here and get step-by-step guidance from our certified tutors!
          </p>
        </div>

        <button
          onClick={() => {
            if (!currentUser) {
              onOpenAuth();
            } else {
              setShowAskForm(!showAskForm);
            }
          }}
          className="flex items-center gap-1.5 text-xs font-bold bg-[#5F7161] text-white hover:bg-[#4D5C4F] px-4 py-3 rounded-xl transition-all cursor-pointer shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          {showAskForm ? 'Close Editor' : 'Ask a Doubt'}
        </button>
      </div>

      {/* Ask Question Form Drawer */}
      {showAskForm && currentUser && (
        <div className="bg-[#F9F7F0] border border-[#E6E2D3] rounded-2xl p-6 shadow-sm">
          <h4 className="text-sm font-serif font-bold text-[#2D3A30] uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#5F7161]" />
            Write your query
          </h4>
          <form onSubmit={handleAskSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">Question Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Confused about limits approaching infinity"
                  className="w-full px-4 py-3 border border-[#E6E2D3] rounded-xl text-sm font-semibold bg-white focus:outline-none focus:border-[#5F7161]/50 text-[#3D3D3D]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">Subject Area</label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-[#E6E2D3] rounded-xl text-sm font-semibold bg-white focus:outline-none text-[#3D3D3D]"
                >
                  {subjects.slice(1).map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">Describe your Doubt</label>
              <textarea
                required
                rows={4}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Paste the problem description, variables, and what steps you have already tried..."
                className="w-full px-4 py-3 border border-[#E6E2D3] rounded-xl text-sm font-semibold bg-white focus:outline-none resize-none leading-relaxed text-[#3D3D3D]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAskForm(false)}
                className="px-4 py-2 text-xs font-bold border border-[#E6E2D3] rounded-xl hover:border-[#5F7161] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-[#5F7161] text-white hover:bg-[#4D5C4F] rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Submit & Get Help
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Subject Badges */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by keywords..."
            className="w-full pl-11 pr-4 py-3 border border-[#E6E2D3] rounded-2xl text-sm font-semibold bg-white focus:outline-none text-[#3D3D3D]"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none md:max-w-md">
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubjectFilter(sub)}
              className={`px-3.5 py-1.5 text-xs font-bold border rounded-xl flex-shrink-0 transition-all cursor-pointer ${
                selectedSubjectFilter === sub
                  ? 'bg-[#5F7161] border-[#5F7161] text-white'
                  : 'bg-white border-[#E6E2D3] hover:border-[#5F7161]/50 text-[#6B6B6B]'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((q) => {
            const isExpanded = expandedQuestionId === q.id;
            return (
              <div
                key={q.id}
                onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                className={`bg-white border border-[#E6E2D3] rounded-xl hover:border-[#5F7161]/40 shadow-sm transition-all cursor-pointer overflow-hidden ${
                  isExpanded ? 'border-[#5F7161]' : ''
                }`}
              >
                {/* Accordion Summary */}
                <div className="p-5 flex justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#5F7161]/10 text-[#5F7161] border border-[#5F7161]/10">
                        {q.subject}
                      </span>
                      <span className="text-[10px] font-bold text-[#9A9483]">
                        Posted by {q.studentName} • {new Date(q.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-base font-serif font-bold text-[#2D3A30] leading-snug">
                      {q.title}
                    </h4>

                    {!isExpanded && (
                      <p className="text-xs text-[#6B6B6B] font-semibold line-clamp-2 leading-relaxed">
                        {q.content}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-center pl-2">
                    <button
                      onClick={(e) => handleLike(e, q.id)}
                      className="p-1.5 hover:bg-neutral-100 rounded-lg flex items-center gap-1.5 border border-[#E6E2D3] text-neutral-500 transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-[#6B6B6B]" />
                      <span className="text-xs font-bold text-[#6B6B6B]">{q.likes}</span>
                    </button>

                    <div className="flex items-center gap-1 text-xs font-bold text-[#5F7161] bg-[#5F7161]/10 px-2 py-1 rounded-lg border border-[#5F7161]/10">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{q.replies.length}</span>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-400" />
                    )}
                  </div>
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="border-t border-[#E6E2D3] bg-[#FDFCF8] p-5 space-y-6" onClick={(e) => e.stopPropagation()}>
                    {/* Full Question Body */}
                    <div className="bg-white p-4 rounded-xl border border-[#E6E2D3] leading-relaxed text-sm font-medium text-[#6B6B6B] whitespace-pre-wrap">
                      {q.content}
                    </div>

                    {/* Replies Panel */}
                    <div className="space-y-4">
                      <h5 className="text-xs font-bold text-[#9A9483] uppercase tracking-widest">
                        Responses ({q.replies.length})
                      </h5>

                      {q.replies.length > 0 ? (
                        <div className="space-y-3">
                          {q.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className={`p-4 rounded-xl border leading-relaxed text-sm font-medium ${
                                reply.authorRole === 'tutor'
                                  ? 'bg-[#5F7161]/5 border-[#5F7161]/20'
                                  : 'bg-white border-[#E6E2D3]'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-[#2D3A30] text-xs">
                                  {reply.authorName}
                                </span>
                                {reply.authorRole === 'tutor' && (
                                  <span className="px-2 py-0.5 rounded-full bg-[#5F7161]/10 text-[#5F7161] text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    Certified Tutor
                                  </span>
                                )}
                                <span className="text-[10px] text-[#9A9483] font-bold ml-auto">
                                  {new Date(reply.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-700 leading-relaxed font-semibold">
                                {reply.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-white rounded-xl border border-dashed border-[#E6E2D3] text-center text-xs text-neutral-500 font-semibold leading-relaxed">
                          No responses yet. Post a reply below or wait for a Learning Collective tutor to review!
                        </div>
                      )}

                      {/* Reply Form */}
                      <form onSubmit={(e) => handleAddReply(e, q.id)} className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={replyText[q.id] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setReplyText((prev) => ({ ...prev, [q.id]: val }));
                          }}
                          placeholder={currentUser ? "Write an answer or follow-up doubt..." : "Sign in to join the conversation!"}
                          disabled={!currentUser}
                          className="flex-1 px-4 py-2.5 border border-[#E6E2D3] rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-[#5F7161]/50 text-[#3D3D3D]"
                        />
                        <button
                          type="submit"
                          disabled={!currentUser}
                          className="p-2.5 bg-[#5F7161] text-white rounded-xl hover:bg-[#4D5C4F] transition-colors border border-[#5F7161] disabled:opacity-50 cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center border border-dashed border-[#E6E2D3] bg-[#FDFCF8] rounded-2xl">
            <BookOpen className="w-12 h-12 text-neutral-300 mx-auto stroke-1" />
            <h4 className="text-sm font-bold text-neutral-700 mt-3">No matching questions found</h4>
            <p className="text-xs text-neutral-500 mt-1 font-semibold">
              Try adjusting your subject filters or clear the search keywords to find other academic queries!
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
