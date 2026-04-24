'use client'

import { useState } from 'react'
import { Section } from '@/types'
import Navigation from '@/components/Navigation/Navigation'
import TaskList from '@/components/Tasks/TaskList'
import GoalList from '@/components/Goals/GoalList'
import HabitList from '@/components/Habits/HabitList'
import styles from './page.module.sass'

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>('tasks')

  return (
    <div className={styles.layout}>
      <Navigation active={activeSection} onChange={setActiveSection} />
      <main className={styles.main}>
        {activeSection === 'tasks' && <TaskList />}
        {activeSection === 'goals' && <GoalList />}
        {activeSection === 'habits' && <HabitList />}
      </main>
    </div>
  )
}
