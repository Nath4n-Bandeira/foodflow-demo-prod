import Link from "next/link";
import { Twitter, Instagram, Youtube, Linkedin } from "lucide-react";

export function footerzinho() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
       
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
        
          <div className="col-span-1">
            <Link href="/" className="flex items-center space-x-3">
              <img src="/horde.png" className="h-10 w-auto" alt="" />
              <span className="text-xl font-bold text-gray-800">foodflow</span>
            </Link>
            <p className="mt-4 text-sm text-gray-600">
              Sua plataforma de gestão de propostas e clientes.
            </p>
          </div>

          <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Desenvolvido por</h3>
              <ul className="space-y-3">
                <li>
                
                </li>
              </ul>

              
              <div className="mt-6 flex space-x-4">
                <a href="https://github.com/Nath4n-Bandeira">
                <img src="/nate.jpg" alt="Dev 1" width={50} height={50} className="rounded" />
                </a>
                <a href="https://github.com/gnevesx">
                <img src="/guilherme.jpg" alt="Dev 2" width={50} height={50} className="rounded" />
                </a>
                <a href="https://github.com/FernandBM">
                <img src="/fernando.png" alt="Dev 3" width={50} height={50} className="rounded" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between py-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2 sm:mb-0 text-center sm:text-left">
            © {new Date().getFullYear()} foodflow. Projeto integrador 
          </p>
         
        </div>
      </div>
    </footer>
  );
}
