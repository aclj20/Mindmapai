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
        className="w-14 h-14 rounded-full bg-purple-600 shadow-md shadow-purple-600/20 flex items-center justify-center hover:bg-purple-700 hover:scale-105 transition-all"
      >
        <Plus className="w-6 h-6 text-white" />
      </Link>
    </motion.div>
  );
}
