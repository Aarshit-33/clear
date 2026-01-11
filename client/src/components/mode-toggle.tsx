import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"
import { motion, AnimatePresence } from "framer-motion"

export function ModeToggle() {
    const { setTheme, theme } = useTheme()

    const cycleTheme = () => {
        if (theme === "dark") setTheme("light")
        else setTheme("dark")
    }

    return (
        <button
            onClick={cycleTheme}
            className="relative p-2 rounded-full hover:bg-secondary text-foreground transition-colors outline-none"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={theme}
                    initial={{ y: -20, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 20, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                >
                    {theme === 'dark' ? (
                        <Moon className="h-[1.2rem] w-[1.2rem]" />
                    ) : (
                        <Sun className="h-[1.2rem] w-[1.2rem]" />
                    )}
                </motion.div>
            </AnimatePresence>
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}
