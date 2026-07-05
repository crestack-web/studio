"use client";

import React from 'react';

const STORIES = [
  {
    name: "Usama Idris Abdullahi",
    business: "Founder of Goodboy Gnut",
    videoUrl: "https://res.cloudinary.com/dzjoqbg2u/video/upload/v1783255044/good_boy_groundut_wjfjao.mp4",
    thumbnail: "https://res.cloudinary.com/dzjoqbg2u/video/upload/v1783255044/good_boy_groundut_wjfjao.jpg",
    quote: "Building my business with Busmo has transformed how I manage operations."
  }
];

export const BuiltWithBusmo: React.FC = () => (
  <section className="built-with-busmo-section">
    <div className="max-w">
      <div className="section-head center">
        <div className="section-label">Built With Busmo</div>
        <h2 className="section-title">
          Meet the entrepreneurs building <em style={{ color: 'var(--purple-mid)' }}>Africa's future.</em>
        </h2>
        <p className="section-sub">
          Real stories from business owners transforming their operations with Busmo.
        </p>
      </div>

      <div className="stories-grid">
        {STORIES.map((story, index) => (
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
              <div className="story-business">{story.business}</div>
              <p className="story-quote">"{story.quote}"</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
