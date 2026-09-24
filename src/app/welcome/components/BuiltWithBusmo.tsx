"use client";

import React from "react";
import { Heart, BookOpen, TrendingUp, Users } from "lucide-react";

const PILLARS = [
  {
    icon: BookOpen,
    title: "Understand the numbers",
    body: "We teach everyday operators how money moves through stock, sales, and expenses — in plain language, not accounting jargon.",
  },
  {
    icon: TrendingUp,
    title: "Run the day better",
    body: "From recording a sale to knowing what is left in stock, we help people use simple systems so the business does not run on memory alone.",
  },
  {
    icon: Users,
    title: "Grow with support",
    body: "Walkthroughs, community sessions, and hands-on guidance for owners who are building — not just buying software.",
  },
];

/** Community / giving-back stories — education focused, not ideal-customer testimonials. */
const COMMUNITY_STORIES = [
  {
    name: "Usama Idris Abdullahi",
    context: "Learning journey · Goodboy Gnut",
    videoUrl:
      "https://res.cloudinary.com/dzjoqbg2u/video/upload/v1783255044/good_boy_groundut_wjfjao.mp4",
    thumbnail:
      "https://res.cloudinary.com/dzjoqbg2u/video/upload/v1783255044/good_boy_groundut_wjfjao.jpg",
    quote:
      "Seeing how to track operations differently helped me think about the business beyond the daily hustle.",
  },
  {
    name: "Ibrahim Shu'aibu",
    context: "Learning journey · Gwanki Plastic Ltd",
    videoUrl:
      "https://res.cloudinary.com/dzjoqbg2u/video/upload/v1784967502/ibrahim_shu_aibu_jrefpb.mp4",
    thumbnail:
      "https://res.cloudinary.com/dzjoqbg2u/video/upload/v1784967502/ibrahim_shu_aibu_jrefpb.jpg",
    quote:
      "These sessions opened up how inventory and process discipline can protect a manufacturing floor.",
  },
];

export const BuiltWithBusmo: React.FC = () => (
  <section className="built-with-busmo-section community-giveback-section">
    <div className="max-w">
      <div className="section-head center">
        <div className="section-label">
          <Heart size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
          Giving back
        </div>
        <h2 className="section-title">
          Helping communities <em style={{ color: "var(--purple-mid)" }}>understand, run &amp; grow.</em>
        </h2>
        <p className="section-sub">
          Busmo is more than a product. We invest time in teaching small operators how business systems
          work — so more people can build with clarity, not guesswork. The stories below are from our
          community education work; they are not meant as our primary customer case studies.
        </p>
      </div>

      <div className="community-pillars">
        {PILLARS.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.title} className="community-pillar">
              <div className="community-pillar-icon">
                <Icon size={22} strokeWidth={2} />
              </div>
              <h3 className="community-pillar-title">{p.title}</h3>
              <p className="community-pillar-body">{p.body}</p>
            </div>
          );
        })}
      </div>

      <div className="community-videos-label">From the community classroom</div>
      <p className="community-videos-note">
        These videos show people we support as they learn. Ideal Busmo users are owners ready to run
        sales, stock, and cash daily — explore Trusted across Africa and product sections for that fit.
      </p>

      <div className="stories-grid">
        {COMMUNITY_STORIES.map((story, index) => (
          <div key={index} className="story-card">
            <div className="story-video-wrapper">
              {story.videoUrl ? (
                <video
                  controls
                  poster={story.thumbnail}
                  className="story-video"
                  preload="metadata"
                >
                  <source src={story.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="story-placeholder">
                  <div className="placeholder-icon">🎬</div>
                  <div className="placeholder-text">Video coming soon</div>
                </div>
              )}
            </div>
            <div className="story-content">
              <h3 className="story-name">{story.name}</h3>
              <div className="story-business">{story.context}</div>
              <p className="story-quote">&ldquo;{story.quote}&rdquo;</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
