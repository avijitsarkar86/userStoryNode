angular.module('storyCtrl', ['storyService'])

        .controller('StoryController', function (Story, socket) {

            var vm = this;

            vm.message = '';

            Story.all()
                    .success(function (data) {
                        vm.stories = data;
                    });

            vm.createStory = function () {
                Story.create(vm.storyData)
                        .success(function (data) {
                            //clearing the form 
                            vm.storyData = '';

                            vm.message = data.message;

                            //vm.stories.push(data)
                        })
            };
            
            socket.on('story', function(data){
                vm.stories.push(data);
            });

        })
        .controller('AllStoriesController', function(stories, socket){
            var vm = this;
            
            vm.stories = stories.data;
            
            socket.on('story', function(data){
                vm.stories.push(data);
            });
        })