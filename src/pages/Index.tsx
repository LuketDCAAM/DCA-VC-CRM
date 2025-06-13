
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Sparkles, Zap, Heart } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Floating Animation Elements */}
          <div className="relative">
            <div className="absolute -top-8 left-1/4 w-16 h-16 bg-blue-100 rounded-full opacity-20 animate-bounce"></div>
            <div className="absolute -top-4 right-1/3 w-12 h-12 bg-indigo-100 rounded-full opacity-30 animate-pulse"></div>
            
            {/* Main Heading */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100 mb-8">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Ready to Build</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
              Your Canvas
              <br />
              Awaits
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              A beautiful foundation built with modern design principles, 
              ready for your next big idea to come to life.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-4 rounded-full text-lg font-semibold border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300">
                Learn More
              </Button>
            </div>
          </div>
        </div>
        
        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 group">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors duration-300">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Lightning Fast</h3>
            <p className="text-gray-600 leading-relaxed">
              Built with modern technologies for optimal performance and smooth user experience.
            </p>
          </Card>
          
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 group">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors duration-300">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Beautiful Design</h3>
            <p className="text-gray-600 leading-relaxed">
              Carefully crafted with attention to detail and modern design principles.
            </p>
          </Card>
          
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 group">
            <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-pink-200 transition-colors duration-300">
              <Heart className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Made with Love</h3>
            <p className="text-gray-600 leading-relaxed">
              Every pixel placed with care to create an exceptional foundation for your project.
            </p>
          </Card>
        </div>
        
        {/* Bottom Section */}
        <div className="text-center mt-20">
          <div className="inline-block p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Start Building?
            </h2>
            <p className="text-blue-100 mb-6 text-lg">
              This beautiful foundation is waiting for your creative touch.
            </p>
            <Button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105">
              Begin Your Journey
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
