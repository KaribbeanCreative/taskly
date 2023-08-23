'use strict';

class TodoList {
   tasks = [];
   ai = 0;
   contentTaskHtml = document.getElementById("contentTask");
   addTextTaskHtml = document.getElementById("addTextTask");
   addTaskHtml = document.getElementById("addTask");

   // 
   constructor () {
      this.addTaskHtml.addEventListener('submit', (e) => {
         e.preventDefault();
         this.addTask();
      });

      // 
      this.contentTaskHtml.addEventListener('notify', this.display);
      this.contentTaskHtml.addEventListener('deleteTask', this.deleteTask);
   }

   //
   addTask = () => {
      const newTask = new Task(this.ai, this.addTextTaskHtml.value);
      this.ai++;
      this.tasks.push(newTask);
      this.addTextTaskHtml.value = '';
      this.display();
   }

   // 
   display = () => {
      this.contentTaskHtml.innerHTML = '';

      const notCompleted = this.tasks.filter((task) => !task.complete);
      notCompleted.forEach((task) => this.contentTaskHtml.appendChild(task.html));

      const completed = this.tasks.filter((task) => task.complete);
      completed.forEach((task) => this.contentTaskHtml.appendChild(task.html));
   }

   // 
   deleteTask = (e) => {
      const id = e.detail;
      const index = this.tasks.findIndex(task => task.id === id);
      this.tasks.splice(index, 1);
   }
}