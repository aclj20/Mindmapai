import { Link } from "react-router";
import { Plus } from "lucide-react";
import { motion } from "motion/react";

export default function FloatingActionButton() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="md:hidden fixed bottom-24 right-6 z-40"
    >
      <Link
        to="/map/create"
        className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 shadow-lg shadow-purple-500/50 flex items-center justify-center hover:shadow-xl hover:scale-110 transition-all"
      >
        <Plus className="w-6 h-6 text-white" />
      </Link>
    </motion.div>
  );
}
