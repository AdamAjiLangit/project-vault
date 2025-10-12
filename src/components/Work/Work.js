"use client";
import { useRef } from "react";

import { projects } from "./project.js";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

export default function Work() {
  const workContainerRef = useRef(null);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);

      const createWorkItem = (project) => {
        const workItem = document.createElement("div");
        workItem.className = "work-item";
        workItem.innerHTML = `
        <a target="_blank" href="${project.route}" class="work-item-link">
          <div class="work-item-img">
            <img src="${project.img}" alt="${project.name}" />
          </div>
          <div class="work-item-copy">
            <h3>${project.name}</h3>
            <p>${project.description}</p>
          </div>
        </a>
      `;
        return workItem;
      };

      const workContainer = workContainerRef.current;

      workContainer.innerHTML = "";

      for (let i = 0; i < projects.length; i += 2) {
        const row = document.createElement("div");
        row.className = "row";

        const leftItemIndex = i % projects.length;
        const rightItemIndex = (i + 1) % projects.length;

        row.appendChild(createWorkItem(projects[leftItemIndex]));

        if (i + 1 < projects.length * 2) {
          row.appendChild(createWorkItem(projects[rightItemIndex]));
        }

        workContainer.appendChild(row);
      }

      gsap.set(".work-item", {
        y: 1000,
      });

      document.querySelectorAll(".row").forEach((row) => {
        const workItems = row.querySelectorAll(".work-item");

        workItems.forEach((item, itemIndex) => {
          const isLeftProjectItem = itemIndex === 0;
          gsap.set(item, {
            rotation: isLeftProjectItem ? -60 : 60,
            transformOrigin: "center center",
          });
        });

        ScrollTrigger.create({
          trigger: row,
          start: "top 50%",
          onEnter: () => {
            gsap.to(workItems, {
              y: 0,
              rotation: 0,
              duration: 1,
              ease: "power4.out",
              stagger: 0.25,
            });
          },
        });
      });
    },
    { scope: workContainerRef }
  );

  return (
    <>
      <section className="work" ref={workContainerRef}></section>
    </>
  );
}
